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

## Diagnostics

Structured diagnostics are opt-in, bounded, and kept in memory. The SDK does
not write or upload reports:

```javascript
const client = new Client({ diagnostics: true });

// After an error:
const report = client.createDiagnosticReport();
console.log(JSON.stringify(report, null, 2));
```

Configure severity, components, history size, and application-owned sinks with
`ClientOptions.diagnostics`. Inspect reports before sharing them. See the
[diagnostics guide](https://fluxerjs.blstmo.com/guides/diagnostics/).

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
