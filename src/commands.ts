import type { Config } from './config.js';
import type { BotController } from './telegram.js';

export function registerCommands(ctrl: BotController, cfg: Config) {
  const { bot, getStatus, setMinUsd, togglePause, isPaused, getThresholds } = ctrl;

  bot.command('ping', (ctx) => ctx.reply('🏓 Alive'));
  bot.command('pause', (ctx) => {
    togglePause(true);
    ctx.reply('⏸️ Alerts paused.');
  });
  bot.command('resume', (ctx) => {
    togglePause(false);
    ctx.reply('▶️ Alerts resumed.');
  });
  bot.command('status', async (ctx) => {
    const s = getStatus();
    const t = getThresholds();
    await ctx.replyWithHTML(
      [
        '📊 <b>Status</b>',
        `• Paused: <b>${isPaused() ? 'Yes' : 'No'}</b>`,
        `• Last block: <code>${s.lastBlock}</code>`,
        `• Buys last 24h: <b>${s.buys24h}</b>`,
        `• Velocity window: <b>${s.velocity.count}/${s.velocity.N} in ${s.velocity.M}m</b>`,
        '',
        '⚙️ <b>Thresholds</b>',
        `• MIN_USD: <b>$${t.MIN_USD}</b>`,
        `• MIN_TOKENS: <b>${t.MIN_TOKENS}</b>`,
        `• WHALE_USD: <b>$${t.WHALE_USD}</b>`,
      ].join('\n')
    );
  });

  bot.command('setminusd', (ctx) => {
    const parts = ctx.message.text.trim().split(/\s+/);
    if (parts.length !== 2) return ctx.reply('Usage: /setminusd <number>');
    const v = Number(parts[1]);
    if (!Number.isFinite(v) || v < 0) return ctx.reply('Please provide a valid non-negative number.');
    setMinUsd(v);
    ctx.reply(`✅ MIN_USD set to $${v}`);
  });

  bot.command('pair', (ctx) => ctx.reply(`🔗 Pair: <code>${cfg.PAIR_ADDRESS}</code>`, { parse_mode: 'HTML' }));
  bot.command('token', (ctx) => ctx.reply(`🧬 Token: <code>${cfg.TOKEN_ADDRESS}</code>`, { parse_mode: 'HTML' }));
}
