import { JsonRpcProvider, Contract } from 'ethers';
import { logger } from './logger.js';
import { loadState, saveState } from './state.js';
import { getLogs } from './etherscan.js';
import { IUniswapV2Pair, SWAP_SIG } from './decoder.js';
import type { Config } from './config.js';

type TG = { send: (html: string) => Promise<void> };

export async function startScheduler(cfg: Config, tg: TG) {
  const provider = new JsonRpcProvider(cfg.PUBLIC_RPC_URL);
  const pair = new Contract(cfg.PAIR_ADDRESS, IUniswapV2Pair, provider);

  let state = loadState();
  if (state.lastProcessedBlock === 0) {
    state.lastProcessedBlock = (await provider.getBlockNumber()) - cfg.CONFIRMATIONS;
  }

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
        const [ , amount0In, amount1In, amount0Out, amount1Out ] = parsed.args as any;

        // TODO: decide which token is amount0/1; here we assume token is token1Out for demo
        const tokenOut = Number(amount1Out); // simplify for example
        const usd = 0; // TODO: compute via reserves and ETH/USD if needed

        // Placeholder thresholds
        if (tokenOut > 0 /* buy */) {
          // Minimal curation
          // TODO: compute buyer ("to"), price, impact bps, wallet age, tags, USD
          const buyer = parsed.args.to;
          const tags = [];
          const msg =
            `🚀 <b>BUY</b>\n` +
            `• Buyer: <code>${buyer.slice(0,6)}…${buyer.slice(-4)}</code>\n` +
            `• Amount: ${tokenOut}\n` +
            `• Tx: <a href="https://etherscan.io/tx/${log.transactionHash}">etherscan</a>\n` +
            `• Block: ${log.blockNumber}`;

          await tg.send(msg);
          state.seenTx[log.transactionHash] = true;
        }
      }

      state.lastProcessedBlock = toBlock;
      saveState(state);
      logger.info({ from, to: toBlock, count: logs.length }, 'Processed window');
    } catch (e: any) {
      logger.error({ err: e?.message }, 'Poll loop error');
    }
  }, cfg.POLL_INTERVAL_SEC * 1000);
}
