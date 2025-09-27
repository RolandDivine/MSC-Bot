// src/telegram.ts
import { Telegraf } from 'telegraf';
import type { Config } from './config.js';

export function initTelegram(cfg: Config, sharedState: any) {
  const bot = new Telegraf(cfg.TELEGRAM_BOT_TOKEN);

  bot.start((ctx) => ctx.reply('👋 Bot is active. Use /status'));
  bot.command('ping', (ctx) => ctx.reply('🏓 Alive'));
  bot.command('pause', (ctx) => { sharedState.paused = true; ctx.reply('⏸ Alerts paused'); });
  bot.command('resume', (ctx) => { sharedState.paused = false; ctx.reply('▶ Alerts resumed'); });
  bot.command('setminusd', (ctx) => {
    const parts = ctx.message.text.split(' ');
    if (parts.length >= 2) {
      sharedState.minUsd = Number(parts[1]);
      ctx.reply(`✅ MIN_USD updated to ${sharedState.minUsd}`);
    }
  });
  bot.command('status', (ctx) => {
    ctx.reply(`ℹ Status\nPaused: ${sharedState.paused}\nLast block: ${sharedState.lastBlock}\nMinUSD: ${sharedState.minUsd}`);
  });

  bot.launch();

  const send = async (html: string) => {
    if (cfg.DRY_RUN || sharedState.paused) return;
    await bot.telegram.sendMessage(cfg.TELEGRAM_CHAT_ID, html, { parse_mode: 'HTML', disable_web_page_preview: true });
  };

  return { send, announce: send, bot };
}
