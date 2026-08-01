/**
 * @beta Multi-instance ClientCluster example.
 *
 * ClientCluster is BETA — API may change. Each runtime needs its OWN instance-issued token.
 * Tokens are not portable across hosted / self-hosted instances.
 *
 * Usage (from repo root after pnpm install && pnpm run build):
 *
 *   # Hosted only
 *   FLUXER_BOT_TOKEN=hosted_token node examples/multi-instance-bot.js
 *
 *   # Self-hosted only (discovery)
 *   SELFHOST_API=https://api.my.instance SELFHOST_BOT_TOKEN=self_token node examples/multi-instance-bot.js
 *
 *   # Both at startup (distinct tokens required)
 *   FLUXER_BOT_TOKEN=hosted_token SELFHOST_API=https://api.my.instance SELFHOST_BOT_TOKEN=self_token node examples/multi-instance-bot.js
 *
 *   # Dynamic add after startup (no process restart):
 *   # send !add-self in a channel the hosted bot can see (requires SELFHOST_API + SELFHOST_BOT_TOKEN)
 *   # send !remove-self to disconnect the self-hosted runtime only
 *   # send !restart-self to rebuild selfhosted with the same env token (token re-supplied)
 *
 * Optional legacy: FLUXER_API_URL overrides the hosted client's API host via ClientOptions.rest.api
 * (does not replace SELFHOST_API discovery).
 */

import {
  BETA_CLIENT_CLUSTER_WARNING,
  ClientCluster,
  ClientClusterEvents,
  Events,
} from '@fluxerjs/core';

console.warn(`[beta] ${BETA_CLIENT_CLUSTER_WARNING}`);

const hostedToken = process.env.FLUXER_BOT_TOKEN;
const selfApi = process.env.SELFHOST_API;
const selfToken = process.env.SELFHOST_BOT_TOKEN;
const legacyApiUrl = process.env.FLUXER_API_URL;

if (!hostedToken && !(selfApi && selfToken)) {
  console.error(
    'Set FLUXER_BOT_TOKEN and/or SELFHOST_API + SELFHOST_BOT_TOKEN (distinct tokens; see examples/README.md).',
  );
  process.exit(1);
}

if (selfApi && !selfToken) {
  console.error('SELFHOST_API requires SELFHOST_BOT_TOKEN (do not reuse FLUXER_BOT_TOKEN).');
  process.exit(1);
}

if (hostedToken && selfToken && hostedToken === selfToken) {
  console.error('Hosted and self-hosted runtimes need different tokens issued by each instance.');
  process.exit(1);
}

/** @type {import('@fluxerjs/core').ClientCluster | undefined} */
let cluster;

/** @param {import('@fluxerjs/core').ClientRuntime} runtime */
function wireHandlers(runtime) {
  const { id, client } = runtime;
  client.on(Events.Ready, () => {
    console.log(
      `[${id}] ready as ${client.user?.username ?? '?'} @ ${client.instance.endpoints.api}`,
    );
  });
  client.on(Events.Error, (err) => {
    console.error(`[${id}] error`, err);
  });
  client.on(Events.MessageCreate, async (message) => {
    if (message.author?.bot) return;
    if (message.content === '!ping') {
      await message.reply(`Pong from \`${id}\` (${client.instance.endpoints.api})`);
    }
    if (message.content === '!instance') {
      const ep = client.instance.endpoints;
      await message.reply(
        [
          `runtime: \`${id}\``,
          `status: ${runtime.status}`,
          `lastError: ${runtime.lastError?.message ?? 'none'}`,
          `api: ${ep.api}`,
          `media: ${ep.media}`,
          `invite: ${ep.invite}`,
          `self_hosted: ${client.instance.discovery?.features?.self_hosted ?? 'unknown'}`,
          '',
          'ClientCluster is beta — each runtime needs its own instance token.',
        ].join('\n'),
      );
    }
    if (message.content === '!add-self') {
      if (!cluster) return;
      if (cluster.has('selfhosted')) {
        await message.reply('`selfhosted` is already connected.');
        return;
      }
      if (!selfApi || !selfToken) {
        await message.reply(
          'Set SELFHOST_API and SELFHOST_BOT_TOKEN to add a self-hosted runtime.',
        );
        return;
      }
      try {
        await cluster.add({
          id: 'selfhosted',
          token: selfToken,
          discovery: selfApi,
        });
        await message.reply('Added `selfhosted` runtime (no process restart).');
      } catch (err) {
        await message.reply(
          `Failed to add selfhosted: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    if (message.content === '!remove-self') {
      if (!cluster) return;
      const ok = await cluster.remove('selfhosted');
      await message.reply(ok ? 'Removed `selfhosted`.' : '`selfhosted` was not connected.');
    }
    if (message.content === '!restart-self') {
      if (!cluster) return;
      if (!selfToken) {
        await message.reply('Set SELFHOST_BOT_TOKEN to restart (token must be re-supplied).');
        return;
      }
      if (!cluster.has('selfhosted')) {
        await message.reply('`selfhosted` is not connected. Use !add-self first.');
        return;
      }
      try {
        await cluster.restart('selfhosted', { token: selfToken });
        await message.reply('Restarted `selfhosted` (token re-supplied; no process restart).');
      } catch (err) {
        await message.reply(
          `Failed to restart selfhosted: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    if (message.content === '!runtimes') {
      if (!cluster) return;
      const list = cluster.values().map((r) => {
        const err = r.lastError ? ` err=${r.lastError.message}` : '';
        return `- ${r.id} (${r.status})${err} ${r.client.instance.endpoints.api}`;
      });
      await message.reply(list.length ? list.join('\n') : 'No runtimes.');
    }
  });
}

cluster = new ClientCluster({
  suppressBetaWarning: true, // we already logged BETA_CLIENT_CLUSTER_WARNING above
  configure: wireHandlers,
});

cluster.on(ClientClusterEvents.RuntimeReady, (rt) => {
  console.log(`[cluster] runtimeReady ${rt.id}`);
});
cluster.on(ClientClusterEvents.RuntimeRemoved, (rt) => {
  console.log(`[cluster] runtimeRemoved ${rt.id}`);
});
cluster.on(ClientClusterEvents.RuntimeError, (rt, err) => {
  console.error(`[cluster] runtimeError ${rt.id}`, err);
});

if (hostedToken) {
  await cluster.add({
    id: 'hosted',
    token: hostedToken,
    ...(legacyApiUrl ? { clientOptions: { rest: { api: legacyApiUrl } } } : {}),
  });
}

if (selfApi && selfToken) {
  await cluster.add({
    id: 'selfhosted',
    token: selfToken,
    discovery: selfApi,
  });
}

if (cluster.size === 0) {
  console.error('No runtimes started.');
  process.exit(1);
}

console.log(
  `Cluster running with ${cluster.size} runtime(s). Try !ping, !instance, !runtimes, !add-self, !remove-self, !restart-self.`,
);

const shutdown = async () => {
  console.log('Shutting down cluster…');
  await cluster.destroy();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
