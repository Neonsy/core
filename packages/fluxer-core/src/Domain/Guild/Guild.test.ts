import { describe, expect, it } from 'vitest';
import { createTestClient, fixtureGuild } from '../../TestKit/Fixtures.js';
import { Guild } from './index.js';
import { upsertGuildFromSnapshot } from './Snapshot.js';

function createGuild(
  overrides: {
    id?: string;
    icon?: string | null;
    banner?: string | null;
    splash?: string | null;
  } = {},
) {
  return new Guild(createTestClient(), {
    id: overrides.id ?? 'guild1',
    name: 'Test Guild',
    icon: overrides.icon ?? null,
    banner: overrides.banner ?? null,
    splash: overrides.splash ?? null,
    owner_id: 'owner1',
    features: [],
    afk_timeout: 0,
    nsfw_level: 0,
    verification_level: 0,
    mfa_level: 0,
    explicit_content_filter: 0,
    default_message_notifications: 0,
  });
}

describe('Guild', () => {
  describe('iconURL()', () => {
    it('returns null when icon is null', () => {
      const guild = createGuild({ icon: null });
      expect(guild.iconURL()).toBeNull();
    });

    it('builds icon URL when icon is set', () => {
      const guild = createGuild({ icon: 'iconhash123' });
      const url = guild.iconURL();
      expect(url).toContain('fluxerusercontent.com/icons/guild1/iconhash123.png');
    });

    it('appends size when provided', () => {
      const guild = createGuild({ icon: 'hash' });
      const url = guild.iconURL({ size: 512 });
      expect(url).toContain('?size=512');
    });
  });

  describe('bannerURL()', () => {
    it('returns null when banner is null', () => {
      const guild = createGuild({ banner: null });
      expect(guild.bannerURL()).toBeNull();
    });

    it('builds banner URL when banner is set', () => {
      const guild = createGuild({ banner: 'bannerhash' });
      const url = guild.bannerURL();
      expect(url).toContain('fluxerusercontent.com/banners/guild1/bannerhash.png');
    });
  });

  describe('splashURL()', () => {
    it('returns null when splash is null', () => {
      const guild = createGuild({ splash: null });
      expect(guild.splashURL()).toBeNull();
    });

    it('builds splash URL when splash is set', () => {
      const guild = createGuild({ splash: 'splashhash' });
      const url = guild.splashURL();
      expect(url).toContain('fluxerusercontent.com/splashes/guild1/splashhash.png');
    });
  });

  describe('constructor', () => {
    it('parses guild id and name', () => {
      const guild = createGuild({ id: 'custom123' });
      expect(guild.id).toBe('custom123');
      expect(guild.name).toBe('Test Guild');
    });

    it('stores memberCount when member_count is provided', () => {
      const guild = new Guild(createTestClient(), fixtureGuild({ member_count: 120 }));
      expect(guild.memberCount).toBe(120);
    });

    it('stores onlineCount when online_count is provided', () => {
      const guild = new Guild(createTestClient(), fixtureGuild({ online_count: 17 }));
      expect(guild.onlineCount).toBe(17);
    });

    it('falls back to approximate_* counts when exact counts are omitted', () => {
      const guild = new Guild(
        createTestClient(),
        fixtureGuild({ approximate_member_count: 90, approximate_presence_count: 11 }),
      );
      expect(guild).toMatchObject({ memberCount: 90, onlineCount: 11 });
    });

    it('prefers exact counts over approximate_*', () => {
      const guild = new Guild(
        createTestClient(),
        fixtureGuild({
          member_count: 120,
          online_count: 17,
          approximate_member_count: 90,
          approximate_presence_count: 11,
        }),
      );
      expect(guild).toMatchObject({ memberCount: 120, onlineCount: 17 });
    });

    it('defaults memberCount and onlineCount to null when omitted', () => {
      const guild = new Guild(createTestClient(), fixtureGuild());
      expect(guild).toMatchObject({ memberCount: null, onlineCount: null });
    });
  });

  describe('upsertGuildFromSnapshot()', () => {
    it('keeps the previous counts when the snapshot omits them', () => {
      const client = createTestClient();
      const previous = new Guild(client, fixtureGuild({ member_count: 120, online_count: 17 }));
      client.guilds.set(previous.id, previous);
      const { guild } = upsertGuildFromSnapshot(client, fixtureGuild({ name: 'Refreshed' }));
      expect(guild).toBe(previous);
      expect(guild).toMatchObject({ name: 'Refreshed', memberCount: 120, onlineCount: 17 });
    });

    it('uses the snapshot counts when present', () => {
      const client = createTestClient();
      const previous = new Guild(client, fixtureGuild({ member_count: 120, online_count: 17 }));
      client.guilds.set(previous.id, previous);
      const { guild } = upsertGuildFromSnapshot(
        client,
        fixtureGuild({ member_count: 130, online_count: 20 }),
      );
      expect(guild).toBe(previous);
      expect(guild).toMatchObject({ memberCount: 130, onlineCount: 20 });
    });
  });

  describe('_patch()', () => {
    it('updates counts only when provided', () => {
      const guild = new Guild(
        createTestClient(),
        fixtureGuild({ member_count: 120, online_count: 17 }),
      );

      guild._patch(fixtureGuild({ member_count: 130, online_count: 20 }));
      expect(guild).toMatchObject({ memberCount: 130, onlineCount: 20 });

      guild._patch(fixtureGuild({ name: 'Still counted' }));
      expect(guild).toMatchObject({
        name: 'Still counted',
        memberCount: 130,
        onlineCount: 20,
      });
    });

    it('accepts approximate_* counts when exact fields are absent', () => {
      const guild = new Guild(createTestClient(), fixtureGuild({ member_count: 120 }));
      guild._patch(fixtureGuild({ approximate_member_count: 99, approximate_presence_count: 4 }));
      expect(guild).toMatchObject({ memberCount: 99, onlineCount: 4 });
    });
  });

  describe('adjustMemberCount()', () => {
    it('increments and decrements when a baseline exists', () => {
      const guild = new Guild(createTestClient(), fixtureGuild({ member_count: 120 }));
      guild.adjustMemberCount(1);
      expect(guild.memberCount).toBe(121);
      guild.adjustMemberCount(-1);
      expect(guild.memberCount).toBe(120);
    });

    it('does not invent a count from null', () => {
      const guild = new Guild(createTestClient(), fixtureGuild());
      guild.adjustMemberCount(1);
      expect(guild.memberCount).toBeNull();
    });

    it('does not go below zero', () => {
      const guild = new Guild(createTestClient(), fixtureGuild({ member_count: 0 }));
      guild.adjustMemberCount(-1);
      expect(guild.memberCount).toBe(0);
    });
  });
});
