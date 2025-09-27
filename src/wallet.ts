import axios from 'axios';
import { logger } from './logger.js';

export async function getFirstSeenTimestamp(address: string, apiKey: string): Promise<number | null> {
  // Use account txlist, asc order, page=1, offset=1 to fetch the first tx quickly.
  const base = 'https://api.etherscan.io/api';
  const qs = `module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&page=1&offset=1&apikey=${apiKey}`;
  try {
    const { data } = await axios.get(`${base}?${qs}`, { timeout: 12000 });
    if (data?.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
      const ts = Number(data.result[0].timeStamp);
      return Number.isFinite(ts) ? ts : null;
    }
    if (data?.status === '0' && data?.message === 'No transactions found') {
      return null; // brand-new / no-tx wallet
    }
  } catch (e: any) {
    logger.warn({ err: e?.message }, 'getFirstSeenTimestamp failed');
  }
  return null;
}

export function daysBetween(fromUnix: number, toUnix: number): number {
  const ms = (toUnix - fromUnix) * 1000;
  return ms <= 0 ? 0 : Math.floor(ms / (1000 * 60 * 60 * 24));
}
