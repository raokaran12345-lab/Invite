/* ============================================================
   lib/anthropic.js — thin SDK wrapper
   One place for: client creation, retries with backoff on
   transient errors, and tolerant JSON extraction from a model
   reply. The rest of the council never touches the SDK directly.
   ============================================================ */
import Anthropic from '@anthropic-ai/sdk';

let _client = null;

function client() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.'
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Which failures are worth retrying (rate limits, overloaded, transient 5xx).
function isTransient(err) {
  const status = err?.status ?? err?.statusCode;
  if (status === 429 || status === 408 || status === 409) return true;
  if (status >= 500 && status <= 599) return true;
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('overloaded') ||
    msg.includes('rate limit') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed')
  );
}

/**
 * Ask the model once and return the concatenated text.
 * @param {object} o
 * @param {string} o.system   system prompt
 * @param {string} o.prompt   user prompt
 * @param {string} o.model
 * @param {number} [o.maxTokens]
 * @param {number} [o.temperature]
 * @param {number} [o.retries]
 */
export async function ask({
  system,
  prompt,
  model,
  maxTokens = 1400,
  temperature = 0.7,
  retries = 4,
}) {
  let attempt = 0;
  // 2s, 4s, 8s, 16s — matches the project's network-retry policy.
  for (;;) {
    try {
      const msg = await client().messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: prompt }],
      });
      return (msg.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
    } catch (err) {
      attempt += 1;
      if (attempt > retries || !isTransient(err)) throw err;
      const waitMs = 2000 * 2 ** (attempt - 1);
      console.warn(
        `  ↻ model call failed (${err?.status || err?.message}); retry ${attempt}/${retries} in ${waitMs / 1000}s`
      );
      await sleep(waitMs);
    }
  }
}

/**
 * Pull a JSON value out of a model reply, tolerating code fences and prose
 * around it. Returns the parsed value, or throws with the raw text attached.
 */
export function extractJson(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty model reply — nothing to parse.');
  }
  // 1) Strip a ```json … ``` (or bare ```) fence if present.
  let body = text.trim();
  const fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) body = fence[1].trim();

  // 2) Try as-is.
  try {
    return JSON.parse(body);
  } catch {
    /* fall through */
  }

  // 3) Slice from the first opening brace/bracket to its matching close.
  const start = body.search(/[[{]/);
  if (start !== -1) {
    const open = body[start];
    const close = open === '{' ? '}' : ']';
    const end = body.lastIndexOf(close);
    if (end > start) {
      const slice = body.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        /* fall through */
      }
    }
  }

  const err = new Error('Could not parse JSON from model reply.');
  err.raw = text;
  throw err;
}

/**
 * Ask the model and parse its reply as JSON. On a parse failure, retry once
 * with a terse "return valid JSON only" nudge before giving up.
 */
export async function askJson(opts) {
  const text = await ask(opts);
  try {
    return extractJson(text);
  } catch (e) {
    const repaired = await ask({
      ...opts,
      temperature: 0,
      prompt:
        opts.prompt +
        '\n\nYour previous reply was not valid JSON. Reply again with VALID JSON ONLY — no prose, no code fence.',
    });
    return extractJson(repaired);
  }
}
