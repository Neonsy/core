/**
 * A single changelog bullet. Use a plain string for short notes, or the object
 * form to pair a bold one-line summary with a longer plain-language explanation.
 */
export type ChangelogItem = string | { summary: string; detail?: string };

export interface ChangelogSection {
  title: string;
  items: ChangelogItem[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  /** Short plain-language overview shown under the version header. */
  summary?: string;
  sections: ChangelogSection[];
}

/** Hand-authored release notes for the docs site. */
export const changelogEntries: ChangelogEntry[] = [
  {
    version: '2.2.0',
    date: '2026-08-01',
    summary:
      'A large client cache rebuild (LimitedCollection + client.cache), Tenor replaced with Klipy for GIF helpers, and a refreshed OpenAPI snapshot with tighter types. Most other breaking changes are import-path moves and small behavior tweaks; the migration notes below walk through each one.',
    sections: [
      {
        title: 'Breaking Changes',
        items: [
          {
            summary: 'Tenor GIF helpers replaced with Klipy',
            detail:
              'resolveTenorToImageUrl and related Tenor exports are removed. Use resolveKlipyToImageUrl (and KlipyMediaResult) from @fluxerjs/core or @fluxerjs/util. Fluxer’s unfurler expects Klipy page URLs in message content; see the GIFs guide.',
          },
          {
            summary: 'Disabling the message cache now uses messages: false, not messages: 0',
            detail:
              'To match the rest of the cache options, a numeric 0 (and other documented numeric zeros) now means "unbounded / no limit" instead of "off". If you passed cache: { messages: 0 } to turn message caching off, it will now cache every message. Use cache: { messages: false } to disable it.',
          },
          {
            summary: 'Deep file imports moved; import from package entrypoints instead',
            detail:
              'Internal layout was reorganized (guild/message structures, sdk options modules, util helpers). Paths like @fluxerjs/core/structures/Guild.ts no longer resolve. Import public names from the package root or documented subpaths (@fluxerjs/core, @fluxerjs/core/client, @fluxerjs/core/message, @fluxerjs/core/cluster, @fluxerjs/core/errors).',
          },
          {
            summary: 'formatEmoji custom output is now name:id (previously :name:id)',
            detail:
              'The leading colon was dropped from the custom-emoji form, and unicode emoji are no longer passed through encodeURIComponent. Update any code that parsed or compared the old :name:id shape.',
          },
          {
            summary: 'Animated emoji identifiers now include the a: prefix (a:name:id)',
            detail:
              'GuildEmoji.identifier and MessageReaction.emojiIdentifier return a:name:id for animated emoji so they round-trip correctly through the API. Static emoji are unchanged and still return name:id.',
          },
          {
            summary: 'message.react() always emits a local messageReactionAdd after the REST call',
            detail:
              'Once the reaction request succeeds, the client emits messageReactionAdd with a structured emoji object ({ name, id?, animated? }) instead of putting the raw wire string into emoji.name. Your listeners and collectors now see the same shape whether the reaction came from you or from the gateway.',
          },
          {
            summary: 'EmbedBuilder.toJSON() always includes description (null when unset)',
            detail:
              'The description field was previously omitted when it had no value. If you snapshot or diff embed JSON, expect an explicit description: null to appear.',
          },
          {
            summary: 'WebSocket identify intents is now optional and defaults to 0',
            detail:
              'Fluxer ignores the legacy Discord-style intents value, so you can drop it entirely. If your code required intents: N, pass intents: 0 or simply omit it.',
          },
          {
            summary: 'Stricter request validation may reject bodies that used to be accepted',
            detail:
              'The vendored OpenAPI snapshot was refreshed against live Fluxer, which tightened nullability on some channel and guild request fields. Payloads that were loosely typed before may now be rejected; align them with the refreshed snapshot.',
          },
        ],
      },
      {
        title: 'Added',
        items: [
          {
            summary: 'LimitedCollection: a bounded cache with FIFO eviction (@fluxerjs/collection)',
            detail:
              'A drop-in Collection that enforces a maximum size, evicting the oldest entries first, with an onEvict callback so you can react when items are dropped.',
          },
          {
            summary: 'client.cache controller for inspecting and clearing caches',
            detail:
              'Read cache stats, run manual sweeps, and cascade-teardown related data across guilds, channels, members, messages, roles, emojis, and stickers from one place.',
          },
          {
            summary: 'Identity-preserving guild snapshots on READY / GUILD_CREATE',
            detail:
              'When a guild is re-sent, its nested caches (members, channels, roles, and so on) are retained on the same guild instance instead of being rebuilt, so existing references stay valid.',
          },
          {
            summary: 'resolveKlipyToImageUrl for embedding Klipy GIFs',
            detail:
              'Resolves a klipy.com page URL to a direct media URL (and animated flags) for EmbedBuilder.setImage. Send the page URL as message content when you want the native gifv unfurl instead.',
          },
          {
            summary: 'ClientEvents payload types exported from @fluxerjs/core',
            detail:
              'Every camelCase ClientEvents payload type (including helpers like GuildRoleUpdatePayload) is public, plus ClientEventName and ClientEventListener for typed listeners.',
          },
          'ClientUser.fetch() and ClientUser.fetchGuilds({ withCounts }) for refreshing the current user and its guilds',
          'client.requestGuildMembers() gateway helper for requesting member chunks',
          'CHANNEL_RECIPIENT_ADD / CHANNEL_RECIPIENT_REMOVE handlers and matching client events',
          'channels.fetch(id, { force }) and matching force/patch behavior on guilds.fetch',
          'GUILD_COUNTS_UPDATE now updates guild.memberCount and guild.onlineCount live',
          'New WebSocket identify options: flags, ignoredEvents, and initialGuildId',
          'OpenAPI gateway coverage, alignment asserts, and Fluxer compare scripts (pnpm openapi:check / openapi:assert)',
          'New cache-bot example and an expanded caching guide',
        ],
      },
      {
        title: 'Changed',
        items: [
          'Internal package layout was reorganized; public imports stay on package entrypoints (see Breaking Changes)',
          'Managers now run on LimitedCollection with cache limits resolved from your options at construction time',
          {
            summary: 'Unhandled gateway dispatches now emit Events.Debug',
            detail:
              'Dispatches the client does not handle surface as a Debug event so they are visible, except session, user, and call events, which stay intentionally unhandled and quiet.',
          },
          'Voice join and move now send explicit mute/deaf/self_* defaults in the state update',
          'The vendored OpenAPI snapshot was refreshed against live Fluxer and the types package was aligned to it',
          'Gateway guild create/ready snapshot typing uses GatewayGuildSnapshot (nested properties plus top-level count fields)',
        ],
      },
      {
        title: 'Fixed',
        items: [
          {
            summary: 'Guild memberCount / onlineCount hydrate from GUILD_CREATE and COUNTS_UPDATE',
            detail:
              'Fluxer puts member_count / online_count on the guild snapshot root (alongside properties). The client merges those top-level fields, keeps prior counts when a later payload omits them, and applies GUILD_COUNTS_UPDATE live.',
          },
          'Synthetic react() events no longer stuff the full wire string into emoji.name',
          'ReactionCollector no longer double-counts repeated self/gateway events for the same user and emoji',
          'CHANNEL_DELETE now cleans up guild-indexed channels after a global FIFO eviction',
          'Channel-create rate_limit_per_user and NSFW/CWL nullability now match the OpenAPI schema',
          'Multipart / undici form serialization from the earlier 2.x patch line is carried forward in this release',
        ],
      },
      {
        title: 'Migration notes',
        items: [
          'Replace resolveTenorToImageUrl / Tenor imports with resolveKlipyToImageUrl (see /guides/gifs/)',
          'Change cache: { messages: 0 } (used to mean "off") to cache: { messages: false }',
          'Replace deep structure imports with named imports from the root, e.g. import { Guild, MessageReaction } from "@fluxerjs/core"',
          'If you matched reactions on emoji.name === "name:id", switch to emoji.id or emojiIdentifier',
          'If you passed ws intents: N, change it to intents: 0 or drop it (Fluxer ignores intents)',
          'Re-run your typecheck against @fluxerjs/types@2.2.0 after upgrading',
        ],
      },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-07-30',
    sections: [
      {
        title: 'Changed',
        items: [
          'Require Node.js ≥ 22.13 across all published packages',
          'REST no longer sends the configured token to cross-origin absolute URLs unless auth: true is set explicitly',
          'Automatic retries now apply only to safe methods (GET/HEAD/OPTIONS) by default; opt mutations in per-request via retryPolicy',
          'Client now honors configured cache limits (managers are constructed after resolving DEFAULT_CACHE_LIMITS with your options)',
        ],
      },
      {
        title: 'Fixed',
        items: [
          'Reactions with external custom emojis are now allowed when permitted by Fluxer',
          'Preserve cached reaction users across gateway events',
          'Correct REST rate-limit bucket identification',
          'Clean up timed-out voice connections',
          'Hydrate and harden normalization of nested gateway guild properties',
        ],
      },
    ],
  },
  {
    version: '2.0.3',
    date: '2026-07-17',
    sections: [
      {
        title: 'Fixed',
        items: [
          'ReactionCollector now handles messageReactionAddMany (gateway-batched reactions), not only messageReactionAdd',
        ],
      },
    ],
  },
  {
    version: '2.0.2',
    date: '2026-07-15',
    sections: [
      {
        title: 'Added',
        items: [
          'REST retryPolicy for per-request retry budgets (e.g. keep retries on GET, disable on writes)',
          'Guild.available plus GuildUnavailable / GuildAvailable for temporary gateway outages',
        ],
      },
      {
        title: 'Fixed',
        items: [
          'User.prototype.send argument typing',
          'Temporary guild unavailability no longer emitted as GuildDelete',
        ],
      },
      {
        title: 'Docs',
        items: [
          'Versioned SDK reference and guides for each tagged release (v2.0.0+)',
          'Website improvements',
        ],
      },
    ],
  },
  {
    version: '2.0.1',
    date: '2026-07-13',
    sections: [
      {
        title: 'Changed',
        items: [
          'Raised Node.js engine requirement (Node 20 support removed; requires Node ≥ 22.13)',
          'Updated undici to v7',
        ],
      },
      {
        title: 'Fixed',
        items: [
          'Dependency audit fixes',
          'Publishing and CI improvements, including bot-login checks',
        ],
      },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-07-11',
    sections: [
      {
        title: 'Major rewrite (non-voice)',
        items: [
          'ChannelType.GuildLink is 998; createChannel uses ChannelCreateRequest (link requires url)',
          'EmbedBuilder: removed setVideo/setAudio; request type RESTPostAPIEmbed separate from APIEmbed',
          'Default bounded caches (DEFAULT_CACHE_LIMITS); reply defaults; GUILD_UPDATE preserves caches',
          'Reaction events emit full ClientEvents arity; Collection first/last/random allocation fixes',
          'Interactions / slash commands removed (not in OpenAPI)',
          'See the [Migrating to 2.0](/guides/migration/) guide',
        ],
      },
    ],
  },
];
