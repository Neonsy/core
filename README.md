# @fluxerjs/core

[![CI](https://github.com/fluxerjs/core/actions/workflows/ci.yml/badge.svg)](https://github.com/fluxerjs/core/actions/workflows/ci.yml)
[![CodeQL](https://github.com/fluxerjs/core/actions/workflows/codeql.yml/badge.svg)](https://github.com/fluxerjs/core/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/@fluxerjs/core.svg)](https://www.npmjs.com/package/@fluxerjs/core)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Socket Badge](https://badge.socket.dev/npm/package/@fluxerjs/core/2.0.0)](https://badge.socket.dev/npm/package/@fluxerjs/core/2.0.0)

SDK for building bots on [Fluxer](https://fluxer.app).

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

### Self-hosted / multiple instances

One `Client` = one Fluxer instance (token, REST, gateway, caches, CDN/invite URLs).
Each instance needs its **own** bot token.

**Beta:** `ClientCluster` can add/remove/restart runtimes without restarting the process.
The API may change; constructing a cluster emits a `FluxerClientClusterBeta` warning.
`restart(id, { token })` requires re-supplying the instance token (never stored).

```javascript
import { ClientCluster, ClientClusterEvents, Events } from '@fluxerjs/core';
// or: import { ClientCluster } from '@fluxerjs/core/cluster';

const cluster = new ClientCluster({
  configure(runtime) {
    runtime.client.on(Events.MessageCreate, async (m) => {
      if (m.content === '!ping') await m.reply(`Pong from ${runtime.id}`);
    });
  },
});

await cluster.add({ id: 'hosted', token: process.env.FLUXER_BOT_TOKEN });
await cluster.add({
  id: 'self',
  token: process.env.SELFHOST_BOT_TOKEN, // must be issued by the self-hosted instance
  discovery: 'https://api.my.instance',
});

// Later — no process restart
await cluster.restart('self', { token: process.env.SELFHOST_BOT_TOKEN });
await cluster.remove('self');
```

You can still manage raw `Client` instances yourself. See [`examples/multi-instance-bot.js`](./examples/multi-instance-bot.js) and the [multi-instance guide](https://fluxerjs.blstmo.com/guides/multi-instance/).

## Documentation

The docs site (`apps/docs`) is a Next.js app: MDX guides, OpenAPI REST reference, and SDK API docs from a custom docgen (TypeScript Compiler API → `public/api/main.json`).

**From the repo root:**

```bash
# Dev server — http://localhost:3333
pnpm run docs:dev

# Build packages + generate docs + Next build
pnpm run docs:build

# Preview the production build
pnpm run docs:preview
```

**What each command does:**

- `docs:dev` — Next.js on port 3333
- `docs:build` — Generates API docs JSON, then builds the Next.js docs site (via turbo)
- `docs:preview` — `next start` on port 3333

## License

Apache-2.0
