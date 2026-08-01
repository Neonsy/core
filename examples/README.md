# Fluxer SDK Examples

Runnable bots for common `@fluxerjs/core` patterns.

## Quickest start

From the repo root after `pnpm install && pnpm run build`:

```bash
FLUXER_BOT_TOKEN=your_token node examples/minimal-bot.js
```

Send `!ping` in a channel the bot can see. Walkthrough: [Basic Bot](https://fluxerjs.blstmo.com/guides/basic-bot/).

## Setup

```bash
pnpm install
pnpm run build
```

Copy `.env.example` to `.env` if you want, or set env vars inline.

## Examples

| Example | What it shows |
| ------- | ------------- |
| [minimal-bot.js](minimal-bot.js) | Login + `!ping` |
| [cache-bot.js](cache-bot.js) | Custom limits, `client.cache.stats()`, periodic sweeps |
| [first-steps-bot.js](first-steps-bot.js) | `!hello`, `!avatar`, `!embed`, `!perms`, `!noreply` |
| [ping-bot.js](ping-bot.js) | Prefix map, embeds, DMs, replies, reactions |
| [voice-bot.js](voice-bot.js) | `!play`, `!playvideo`, `!stop` (**voice being reworked**) |
| [info-bot.js](info-bot.js) | `!userinfo`, `!serverinfo`, `!roleinfo`, nick/avatar |
| [collectors-bot.js](collectors-bot.js) | `!ask`, `!vote` timed collectors |
| [attachments-bot.js](attachments-bot.js) | Buffer upload, spoiler, URL attach |
| [reaction-bot.js](reaction-bot.js) | Reaction add/remove logging |
| [reaction-roles-bot.js](reaction-roles-bot.js) | `!roles` reaction role picker |
| [webhook-bot.js](webhook-bot.js) | Create / list / send / delete webhooks |
| [moderation-bot.js](moderation-bot.js) | Ban, kick, unban, `!perms` |
| [multi-instance-bot.js](multi-instance-bot.js) | Beta `ClientCluster` |

Docs site mirrors these under `/examples/`.

## 2.0 habits these use

- Pass `EmbedBuilder` into `reply` / `send` / `edit` (no `.toJSON()` at call sites)
- CamelCase options (`deleteMessageDays`, `customStatus`, `avatarUrl`)
- Reaction events: one payload `{ reaction, user, emoji, userId, messageId, channelId }`
- `parsePrefixCommand` / `parseUserMention`
- `member.roles.add` / `remove` / `has`

## Environment

| Variable | Notes |
| -------- | ----- |
| `FLUXER_BOT_TOKEN` | Required for gateway bots |
| `FLUXER_API_URL` | Optional custom API host |
| `SELFHOST_API` / `SELFHOST_BOT_TOKEN` | Multi-instance (distinct tokens) |
| `VOICE_DEBUG` | Voice logs |
| `REACTION_ROLES_*` / `ROLE_*` | Reaction roles example |

Full docs: https://fluxerjs.blstmo.com
