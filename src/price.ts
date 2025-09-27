// src/price.ts
import { Contract, JsonRpcProvider } from 'ethers';
import type { Config } from './config.js';

const IUniswapV2PairABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
];

export class PriceOracle {
  private pair: Contract;
  private provider: JsonRpcProvider;
  private cfg: Config;
  private baseIsToken0 = false;

  constructor(cfg: Config) {
    this.cfg = cfg;
    this.provider = new JsonRpcProvider(cfg.PUBLIC_RPC_URL);
    this.pair = new Contract(cfg.PAIR_ADDRESS, IUniswapV2PairABI, this.provider);
  }

  async init() {
    const [token0, token1] = await Promise.all([this.pair.token0(), this.pair.token1()]);
    this.baseIsToken0 = token0.toLowerCase() !== this.cfg.TOKEN_ADDRESS.toLowerCase();
  }

  async getTokenPriceUSD(): Promise<number> {
    const [reserve0, reserve1] = await this.pair.getReserves();

    let tokenReserve: bigint, baseReserve: bigint;
    if (this.baseIsToken0) {
      tokenReserve = reserve1;
      baseReserve = reserve0;
    } else {
      tokenReserve = reserve0;
      baseReserve = reserve1;
    }

    const priceBasePerToken = Number(baseReserve) / Number(tokenReserve);

    if (this.cfg.PRICE_QUOTE_SIDE === 'USDC') {
      return priceBasePerToken; // already in USD
    } else {
      // multiply by ETH/USD
      const ethUsd = await this.getEthUsd();
      return priceBasePerToken * ethUsd;
    }
  }

  private async getEthUsd(): Promise<number> {
    try {
      // Coingecko lightweight API
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await res.json();
      return data.ethereum.usd ?? 0;
    } catch {
      return 0;
    }
  }
}
