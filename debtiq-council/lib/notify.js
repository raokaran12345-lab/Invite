/* ============================================================
   lib/notify.js — getting a human's attention
   Red flags always print to the terminal (handled by the caller)
   and append to state/RED-FLAGS.md (handled by the store). This
   module is the *push* layer for when the loop runs unattended:
   desktop toast, an incoming webhook, and/or Telegram.
   Every channel fails soft — a broken webhook never stops a round.
   ============================================================ */
import { exec } from 'node:child_process';
import os from 'node:os';

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 8000 }, (err) => resolve(!err));
  });
}

function shellQuote(s) {
  // Safe single-quoting for POSIX shells.
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

/** Best-effort native desktop notification. Never throws. */
async function desktop(title, message) {
  if (process.env.DESKTOP_NOTIFY === '0') return false;
  try {
    const platform = os.platform();
    if (platform === 'darwin') {
      const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(
        title
      )} sound name "Submarine"`;
      return await run(`osascript -e ${shellQuote(script)}`);
    }
    if (platform === 'linux') {
      return await run(`notify-send -u critical ${shellQuote(title)} ${shellQuote(message)}`);
    }
    if (platform === 'win32') {
      const ps = `New-BurntToastNotification -Text ${shellQuote(title)}, ${shellQuote(message)}`;
      return await run(`powershell -NoProfile -Command ${shellQuote(ps)}`);
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** POST a Slack/Discord-style JSON payload to a generic incoming webhook. */
async function webhook(title, message) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return false;
  const text = `*${title}*\n${message}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // `text` suits Slack & generic; `content` suits Discord. Send both.
      body: JSON.stringify({ text, content: text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Send via a Telegram bot if both token and chat id are configured. */
async function telegram(title, message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🏛 *${title}*\n${message}`,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fire every configured push channel for one alert.
 * @returns {Promise<{desktop:boolean, webhook:boolean, telegram:boolean}>}
 */
export async function pushAlert(title, message) {
  const [d, w, t] = await Promise.all([
    desktop(title, message),
    webhook(title, message),
    telegram(title, message),
  ]);
  return { desktop: d, webhook: w, telegram: t };
}
