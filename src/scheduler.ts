// src/scheduler.ts
import { JsonRpcProvider, Contract } from 'ethers';
import { logger } from './logger.js';
import { loadState, saveState } from './state.js';
import { getLogs, getWalletFirstTx } from './etherscan.js';
import { IUniswapV2Pair, SWAP_SIG } from './decoder.js';
import { PriceOracle } from './price.js';
import { tagsFor, passesThresholds } from './curator.js';
import { VelocityTracker } from './velocity.js';
import type { Config } from './config.js';

type TG = { send: (html: string) => Promise<void> };

export async function startScheduler(cfg: Config, tg: TG, sharedState: any) {
  const provider = new JsonRpcProvider(cfg.PUBLIC_RPC_URL);
  const pair = new Contract(cfg.PAIR_ADDRESS, IUniswapV2Pair, provider);
  const oracle = new PriceOracle(cfg);
  await oracle.init();

  let state = loadState();
  if (state.lastProcessedBlock === 0) {
    state.lastProcessedBlock = (await provider.getBlockNumber()) - cfg.CONFIRMATIONS;
  }

  const velocity = new VelocityTracker(5, 3); // 3 buys in 5 min => velocity

  setInterval(async () => {
    try {
      const latest = await provider.getBlockNumber();
      const toBlock = latest - cfg.CONFIRMATIONS;
      if (toBlock <= state.lastProcessedBlock) return;

      const from = state.lastProcessedBlock + 1;
      const logs = await getLogs({
        address: cfg.PAIR_ADDRESS,
        fromBlock: from,
        toBlock,
        topics: [SWAP_SIG],
        apiKey: cfg.ETHERSCAN_API_KEY
      });

      for (const log of logs) {
        if (state.seenTx[log.transactionHash]) continue;
        const parsed = pair.interface.parseLog({ topics: log.topics, data: log.data });
        const [sender, amount0In, amount1In, amount0Out, amount1Out, to] = parsed.args as any;

        // Example: assume token is amount1Out
        const tokenAmount = Number(amount1Out) / 1e18;
        if (tokenAmount <= 0) continue;

        const tokenPriceUsd = await oracle.getTokenPriceUSD();
        const usdValue = tokenAmount * tokenPriceUsd;

        if (!passesThresholds({ tokenAmount, usd: usdValue }, cfg)) continue;

        const walletFirstTx = await getWalletFirstTx(to, cfg.ETHERSCAN_API_KEY);
        const walletAgeDays = walletFirstTx ? ((Date.now() - walletFirstTx.getTime()) / (1000*60*60*24)) : 9999;

        const tags = tagsFor(usdValue, walletAgeDays, cfg);
        velocity.record();
        if (velocity.check()) tags.concat('⚡ Velocity');

        const msg =
          `🚀 <b>BUY ${cfg.TOKEN_ADDRESS.slice(0,6)}..</b>\n` +
          `• Buyer: <code>${to.slice(0,6)}…${to.slice(-4)}</code> (${tags})\n` +
          `• Amount: ${tokenAmount.toFixed(2)} ≈ $${usdValue.toFixed(2)}\n` +
          `• Price: $${tokenPriceUsd.toFixed(4)}\n` +
          `• <a href="https://etherscan.io/tx/${log.transactionHash}">Tx</a>\n` +
          `• Block: ${log.blockNumber}`;

        await tg.send(msg);
        state.seenTx[log.transactionHash] = true;
      }

      state.lastProcessedBlock = toBlock;
      sharedState.lastBlock = toBlock;
      saveState(state);
      logger.info({ from, to: toBlock, count: logs.length }, 'Processed window');
    } catch (e: any) {
      logger.error({ err: e?.message }, 'Poll loop error');
    }
  }, cfg.POLL_INTERVAL_SEC * 1000);
}
