import 'dotenv/config';
import { logger } from './logger.js';
import { loadConfig } from './config.js';
import { initTelegram } from './telegram.js';
import { startScheduler } from './scheduler.js';

async function main() {
  const cfg = loadConfig();
  const tg = initTelegram(cfg);

  logger.info({ token: cfg.TOKEN_ADDRESS, pair: cfg.PAIR_ADDRESS }, 'Booting bot');
  await tg.announce('🤖 Bot online. Use /status anytime.');

  await startScheduler(cfg, tg);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
