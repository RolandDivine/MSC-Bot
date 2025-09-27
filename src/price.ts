import axios from 'axios';
import { Contract, JsonRpcProvider } from 'ethers';
import { logger } from './logger.js';
import type { Config } from './config.js';
import { IUniswapV2Pair } from './decoder.js';

export type PairMeta = {
  token0: string;
  token1: string;
};

export async function getPairMeta(cfg: Config, provider: JsonRpcProvider): Promise<PairMeta> {
  const pair = new Contract(cfg.PAIR_ADDRESS, IUniswapV2Pair, provider);
  const [token0, token1] = await Promise.all([pair.token0(), pair.token1()]);
  return { token0: token0.toLowerCase(), token1: token1.toLowerCase() };
}

export async function getReservesNow(cfg: Config, provider: JsonRpcProvider) {
  const pair = new Contract(cfg.PAIR_ADDRESS, IUniswapV2Pair, provider);
  const { _reserve0, _reserve1 } = await pair.getReserves();
  return { reserve0: Number(_reserve0), reserve1: Number(_reserve1) };
}

let lastEthUsd = 0;
let lastEthUsdTs = 0;

/** Pluggable ETH/USD provider with in-memory cache (30s TTL). */
export async function getEthUsd(cfg: Config): Promise<number> {
  const ttlMs = 30_000;
  if (cfg.PRICE_QUOTE_SIDE === 'USDC') return 1; // not used if base is USDC/USDT, but guard anyway
  const now = Date.now();
  if (now - lastEthUsdTs < ttlMs && lastEthUsd > 0) return lastEthUsd;

  try {
    // Default: CoinGecko simple price (no key required)
    const url = cfg.ETHUSD_URL ?? 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
    const { data } = await axios.get(url, { timeout: 8000 });
    const v =
      data?.ethereum?.usd ??
      data?.result?.price ?? // allow alternative formats if user overrides endpoint
      0;
    if (v > 0) {
      lastEthUsd = Number(v);
      lastEthUsdTs = now;
      return lastEthUsd;
    }
  } catch (e: any) {
    logger.warn({ err: e?.message }, 'ETH/USD provider error; keeping last cache if any');
  }
  if (lastEthUsd > 0) return lastEthUsd;
  // Worst case fallback (kept explicit so dev notices):
  return 2000;
}

/**
 * Compute token price (USD), trade USD notional, and rough price impact (bps).
 * Assumptions:
 * - TOKEN is either token0 or token1 in the pair.
 * - When it's a BUY, tokenOut is the target token amount received by buyer.
 * - base is WETH/USDC on the other side of the pair.
 */
export async function computePricing(args: {
  cfg: Config;
  provider: JsonRpcProvider;
  tokenIs0: boolean; // true if TOKEN == token0
  tokenOut: number;  // amount of TOKEN out from pair to buyer (buy)
}) {
  const { cfg, provider, tokenIs0, tokenOut } = args;
  const pair = new Contract(cfg.PAIR_ADDRESS, IUniswapV2Pair, provider);
  const [r0r1, ethUsdMaybe] = await Promise.all([pair.getReserves(), getEthUsd(cfg)]);
  const reserve0 = Number(r0r1._reserve0);
  const reserve1 = Number(r0r1._reserve1);

  // priceToken = baseReserve / tokenReserve
  const tokenReserve = tokenIs0 ? reserve0 : reserve1;
  const baseReserve  = tokenIs0 ? reserve1 : reserve0;

  // Base per token
  const basePerToken = tokenReserve > 0 ? baseReserve / tokenReserve : 0;

  // Base -> USD
  const baseToUSD =
    cfg.PRICE_QUOTE_SIDE === 'USDC'
      ? 1
      : ethUsdMaybe; // WETH * ETHUSD

  const tokenPriceUSD = basePerToken * baseToUSD;
  const tradeUsd = tokenOut * tokenPriceUSD;

  // Very rough impact in bps: ΔP/P ≈ qty / reserve (on base or token side).
  // Using constant product intuition; this is a simplified heuristic.
  const impactBps = tokenReserve > 0 ? Math.min(10_000, (tokenOut / tokenReserve) * 10_000) : 0;

  return {
    tokenPriceUSD,
    tradeUsd,
    impactBps: Math.round(impactBps),
  };
}
