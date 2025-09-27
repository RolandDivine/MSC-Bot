import type { Config } from './config.js';

export function passesThresholds(args: { tokenAmount: number; usd: number }, cfg: Config, stateMinUsd?: number) {
  const minUsd = typeof stateMinUsd === 'number' ? stateMinUsd : cfg.MIN_USD;
  if (args.tokenAmount < cfg.MIN_TOKENS) return false;
  if (args.usd < minUsd) return false;
  return true;
}

export function tagsFor(usd: number, walletAgeDays: number | null, velocityHit: boolean, cfg: Config) {
  const tags: string[] = [];
  if (usd >= cfg.WHALE_USD) tags.push('🐋 Whale');
  if (walletAgeDays !== null && walletAgeDays < cfg.NEW_WALLET_DAYS) tags.push('🆕 New');
  if (velocityHit) tags.push('⚡ Velocity');
  return tags.join(', ') || '—';
}

export function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Return true if at least N buys within last M minutes including current. */
export function updateVelocityAndCheck(nowSec: number, arr: number[], N: number, Mins: number): boolean {
  const cutoff = nowSec - Mins * 60;
  const filtered = arr.filter((t) => t >= cutoff);
  filtered.push(nowSec);
  arr.length = 0; arr.push(...filtered);
  return arr.length >= N;
}

export function updateBuys24h(nowSec: number, arr: number[]): number {
  const cutoff = nowSec - 24 * 60 * 60;
  const filtered = arr.filter((t) => t >= cutoff);
  filtered.push(nowSec);
  arr.length = 0; arr.push(...filtered);
  return arr.length;
}
