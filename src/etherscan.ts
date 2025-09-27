import axios from 'axios';
import { logger } from './logger.js';

const BASE = 'https://api.etherscan.io/api';

export async function getLogs(params: {
  address: string;
  fromBlock: number;
  toBlock: number | 'latest';
  topics?: (string | null)[];
  apiKey: string;
}) {
  const { address, fromBlock, toBlock, topics = [], apiKey } = params;
  const topicQuery = topics.filter(Boolean).map((t, i) => `topic${i}=${t}`).join('&');
  const url = `${BASE}?module=logs&action=getLogs&address=${address}&fromBlock=${fromBlock}&toBlock=${toBlock}&${topicQuery}&apikey=${apiKey}`;

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    if (data.status !== '1') {
      logger.warn({ message: data.message, result: data.result }, 'Etherscan getLogs non-OK');
      return [];
    }
    return data.result as Array<any>;
  } catch (e: any) {
    logger.error({ err: e?.message }, 'Etherscan getLogs error');
    return [];
  }
}

/** Fetch a block's timestamp for a given blockNumber via Etherscan. */
export async function getBlockTimestamp(blockNumber: number, apiKey: string): Promise<number | null> {
  try {
    const url = `${BASE}?module=block&action=getblockreward&blockno=${blockNumber}&apikey=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 12000 });
    const ts = Number(data?.result?.timeStamp);
    return Number.isFinite(ts) ? ts : null;
  } catch (e: any) {
    logger.warn({ err: e?.message }, 'getBlockTimestamp failed');
    return null;
  }
}
