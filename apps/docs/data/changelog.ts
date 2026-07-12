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
