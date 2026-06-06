# DebtIQ Council 🏛

An **autonomous** AI advisory council for DebtIQ. It runs deliberation rounds with
no human in the loop — six advisors each hunt for the one problem most likely to
sink the business, the Chair forces a focus and scores maturity, and a risk
sentinel **notifies you the moment a red flag crosses your threshold.**

## What it does each round

1. **Ingests** any real-world data you’ve dropped into `./evidence` (then archives it).
1. **Problem-finding** — each member independently surfaces their top problem.
1. **Agenda + maturity score** — the Chair picks the 2-3 highest-leverage problems and scores how close you are to a *sustainable, expandable* business.
1. **Solutions + actions** — sharpest fix per problem, plus 3-5 prioritized actions (cheap validation first) and questions only real data can answer.
1. **Red-flag scan** — flags compliance / cash / fatal-risk / building-without-validation issues; anything at or above your severity threshold pings you.
1. **Persists** everything and carries decisions forward so it builds on itself.

## Setup

```bash
cd debtiq-council
npm install
cp .env.example .env        # add your ANTHROPIC_API_KEY
```

## Run

```bash
node council.js --once        # one round, then exit (start here)
node council.js --rounds=5    # five rounds
node council.js               # continuous, no intervention (interval from .env)
node council.js --interval=600 --model=claude-opus-4-8
node council.js --once --mock # run with NO key — see the full loop (simulated)
```

### Try it with no API key (offline/simulated)

Don’t have a key handy, or just want to watch the machinery run? With no
`ANTHROPIC_API_KEY` set, the council automatically runs in **offline mode**: the
entire loop executes — problem-finding, the maturity governor, the red-flag
sentinel, persistence, evidence reaction and stall detection — using
deterministic, clearly-labelled `[SIMULATED]` output. **No model is called and no
network is used.** It is *not* real analysis; it exists so you can verify the
engine end-to-end and see exactly what the artifacts look like. Set a real key
(or pass `--live`) and the identical code path produces genuine deliberation.

## Getting notified

Red flags always print to the terminal and append to `state/RED-FLAGS.md`.
For push alerts while it runs unattended, set in `.env`:

- `ALERT_WEBHOOK_URL` — any Slack/Discord-style “post JSON” webhook, **or**
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.

Desktop notifications are attempted automatically (macOS `osascript`, Linux
`notify-send`, Windows BurntToast).

## Feeding it ground truth (this is what makes it work)

Drop a `.md`, `.txt`, `.json`, or `.csv` into `./evidence` anytime — broker
interview notes, real API+Textract cost per deal, sign-ups, pricing test results.
The council folds it into the next round and only *then* can the maturity score
climb past 50.

## The honest part

This loop has **no ground truth of its own.** Left to reason in a vacuum it would
generate endless plausible “progress,” so two governors are built in:

- **Maturity is capped at ~50 without real evidence.** Plans and analysis alone
  cannot make it climb. Only validated reality (paying brokers, retention, real
  costs, signed distribution) earns the higher band.
- **Stall detection.** If the score flatlines for several rounds, the council
  stops adding rounds and tells you exactly what to go validate — then resumes
  when you drop findings into `./evidence`.

It will not build the business for you. It surfaces blind spots, forces rigor,
and tells you the next cheapest thing to test. You are still the executor and the
source of truth. Compliance flags are pointers — not legal advice; confirm NCCP /
Privacy Act questions with a lawyer.

## Cost

Each round is roughly `(members + 3)` model calls. Use Sonnet/Haiku for the loop,
Opus for occasional deep rounds, and a sane `--interval`. Current model pricing:
<https://docs.claude.com/en/docs/about-claude/pricing>

## Files

```
config.js          roster, lenses, brief seed, tunables
council.js         the autonomous engine + loop
lib/anthropic.js   SDK wrapper, retries, JSON parsing
lib/store.js       durable memory + evidence inbox
lib/notify.js      console / file / desktop / webhook / Telegram
state/             created at runtime (memory, rounds, LATEST.md, RED-FLAGS.md)
evidence/          drop real data here anytime
```
