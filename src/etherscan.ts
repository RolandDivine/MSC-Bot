// src/etherscan.ts
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

export async function getWalletFirstTx(address: string, apiKey: string): Promise<Date | null> {
  const url = `${BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${apiKey}`;
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    if (data.status !== '1' || data.result.length === 0) return null;
    const ts = Number(data.result[0].timeStamp) * 1000;
    return new Date(ts);
  } catch {
    return null;
  }
}
