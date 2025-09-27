// src/index.ts
import 'dotenv/config';
import { logger } from './logger.js';
import { loadConfig } from './config.js';
import { initTelegram } from './telegram.js';
import { startScheduler } from './scheduler.js';

async function main() {
  const cfg = loadConfig();
  const sharedState: any = { paused: false, lastBlock: 0, minUsd: cfg.MIN_USD };
  const tg = initTelegram(cfg, sharedState);

  logger.info({ token: cfg.TOKEN_ADDRESS, pair: cfg.PAIR_ADDRESS }, 'Booting bot');
  await tg.announce('🤖 Bot online. Use /status anytime.');

  await startScheduler(cfg, tg, sharedState);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
