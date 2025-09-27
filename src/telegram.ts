import { Telegraf } from 'telegraf';
import type { Config } from './config.js';

export function initTelegram(cfg: Config) {
  const bot = new Telegraf(cfg.TELEGRAM_BOT_TOKEN);

  bot.start((ctx) => ctx.reply('👋 Bot is active. Use /status'));
  bot.command('ping', (ctx) => ctx.reply('🏓 Alive'));
  // You can wire more commands here reading shared state

  bot.launch();

  const send = async (html: string) => {
    if (cfg.DRY_RUN) return;
    await bot.telegram.sendMessage(cfg.TELEGRAM_CHAT_ID, html, { parse_mode: 'HTML', disable_web_page_preview: true });
  };

  return {
    send,
    announce: send,
    bot
  };
}
