import type { Config } from './config.js';

export function passesThresholds(args: { tokenAmount: number; usd: number }, cfg: Config) {
  if (args.tokenAmount < cfg.MIN_TOKENS) return false;
  if (args.usd < cfg.MIN_USD) return false;
  return true;
}

export function tagsFor(usd: number, walletAgeDays: number, cfg: Config) {
  const tags: string[] = [];
  if (usd >= cfg.WHALE_USD) tags.push('🐋 Whale');
  if (walletAgeDays < cfg.NEW_WALLET_DAYS) tags.push('🆕 New');
  return tags.join(', ') || '—';
}
