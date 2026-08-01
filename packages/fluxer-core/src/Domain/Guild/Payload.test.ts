import { describe, expect, it } from 'vitest';
import { normalizeGuildSnapshotPayload, normalizeGuildUpdatePayload } from './Payload.js';

const guildProperties = {
  id: 'g1',
  name: 'Test Guild',
  icon: null,
  banner: null,
  splash: null,
  owner_id: 'owner1',
  features: [],
  afk_timeout: 0,
  nsfw_level: 0,
  verification_level: 0,
  mfa_level: 0,
  explicit_content_filter: 0,
  default_message_notifications: 0,
};

describe('normalizeGuildSnapshotPayload', () => {
  it('unwraps nested gateway properties and preserves top-level roles', () => {
    const roles = [
      {
        id: 'r1',
        name: 'Role',
        color: 0,
        position: 1,
        permissions: '0',
        hoist: false,
        mentionable: false,
      },
    ];

    expect(
      normalizeGuildSnapshotPayload({
        id: 'g1',
        properties: guildProperties,
        roles,
        channels: [],
        members: [],
      }),
    ).toEqual({ ...guildProperties, roles });
  });

  it('merges top-level member_count and online_count onto nested properties', () => {
    expect(
      normalizeGuildSnapshotPayload({
        id: 'g1',
        properties: guildProperties,
        member_count: 120,
        online_count: 17,
        joined_at: '2024-01-01T00:00:00.000Z',
        roles: [],
        channels: [],
        members: [],
      }),
    ).toEqual({
      ...guildProperties,
      roles: [],
      member_count: 120,
      online_count: 17,
      joined_at: '2024-01-01T00:00:00.000Z',
    });
  });

  it('prefers top-level counts over counts nested inside properties', () => {
    expect(
      normalizeGuildSnapshotPayload({
        id: 'g1',
        properties: { ...guildProperties, member_count: 1, online_count: 1 },
        member_count: 250,
        online_count: 40,
      }),
    ).toMatchObject({ member_count: 250, online_count: 40 });
  });

  it('preserves legacy flat snapshots', () => {
    expect(normalizeGuildSnapshotPayload(guildProperties)).toBe(guildProperties);
  });

  it('preserves a flat snapshot with an unrelated future properties field', () => {
    const payload = { ...guildProperties, properties: { discovery: 'enabled' } };

    expect(normalizeGuildSnapshotPayload(payload)).toBe(payload);
  });

  it('rejects nested snapshots whose inner and outer IDs differ', () => {
    expect(
      normalizeGuildSnapshotPayload({ id: 'other-guild', properties: guildProperties }),
    ).toBeNull();
  });

  it('rejects nested snapshots without a complete hydratable identity', () => {
    expect(
      normalizeGuildSnapshotPayload({
        id: 'g1',
        properties: { id: 'g1', owner_id: 'owner1' },
      }),
    ).toBeNull();
    expect(
      normalizeGuildSnapshotPayload({
        id: 'g1',
        properties: { id: 'g1', name: 'Missing owner' },
      }),
    ).toBeNull();
  });

  it('rejects snapshots with invalid top-level roles', () => {
    expect(
      normalizeGuildSnapshotPayload({
        id: 'g1',
        properties: guildProperties,
        roles: 'invalid',
      }),
    ).toBeNull();
  });

  it('rejects payloads that are valid as both flat and nested snapshots', () => {
    expect(
      normalizeGuildSnapshotPayload({
        ...guildProperties,
        properties: guildProperties,
      }),
    ).toBeNull();
  });

  it.each([null, 'invalid', []])('rejects malformed nested properties: %j', (properties) => {
    expect(normalizeGuildSnapshotPayload({ id: 'g1', properties })).toBeNull();
  });
});

describe('normalizeGuildUpdatePayload', () => {
  it('preserves flat partial updates without interpreting properties', () => {
    const payload = {
      id: 'g1',
      name: 'Updated Guild',
      properties: { ...guildProperties, name: 'Wrong Guild' },
    };

    expect(normalizeGuildUpdatePayload(payload)).toBe(payload);
  });
});
