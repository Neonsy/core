export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSection[];
}

/** Hand-authored release notes for the docs site. */
export const changelogEntries: ChangelogEntry[] = [
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
