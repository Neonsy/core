# @fluxerjs/core

Main client for the Fluxer bot SDK.

## Install

```bash
pnpm add @fluxerjs/core
```

## Usage

```javascript
import { Client, Events } from '@fluxerjs/core';

const client = new Client({ intents: 0 });

client.on(Events.Ready, () => console.log('Ready'));
client.on(Events.MessageCreate, async (m) => {
  if (m.content === '!ping') await m.reply('Pong');
});

await client.login(process.env.FLUXER_BOT_TOKEN);
```

### Cache limits and sweeps

```javascript
const client = new Client({
  cache: { guilds: 100, messages: 25 }, // messages: false to disable
});

client.on(Events.Ready, () => console.log(client.cache.stats()));
client.cache.sweepMessages((msg) => Date.now() - Date.parse(msg.timestamp) > 3_600_000);
```

See `examples/cache-bot.js` and the [Caching guide](https://fluxerjs.blstmo.com/guides/caching/).

Self-hosted / multi-instance: use `Client.fromDiscovery(origin)` or `ClientOptions.instance`.
**Beta:** `ClientCluster` (also `@fluxerjs/core/cluster`) can add/remove/restart independently-tokened
runtimes without process restart — see `examples/multi-instance-bot.js`. API may change.
Supports `addAll()`, `restart(id, { token })` (token must be re-supplied), typed lifecycle events,
and runtime `status` including `error` + `lastError`.

For voice, add `@fluxerjs/voice`. For embeds, use `EmbedBuilder`.

## Subpath imports (tree-shaking)

Bundlers can pull smaller graphs when you import only what you need:

- `@fluxerjs/core/client` — `Client`, `Events`, `ClientOptions`
- `@fluxerjs/core/errors` — `FluxerError`, `ErrorCodes`
- `@fluxerjs/core/message` — `Message`, `PartialMessage`, send/edit types
- `@fluxerjs/core/cluster` — **beta** `ClientCluster` multi-runtime supervisor

Related: `@fluxerjs/types/routes` (route builders only), `@fluxerjs/rest/request-manager` (HTTP layer without the full `REST` facade).
