import { describe, it, expect } from 'vitest';
import { type Client, Invite } from '../';
import { InviteType } from '@fluxerjs/types';
import { DEFAULT_INSTANCE_ENDPOINTS } from '../util/instance.js';

function createMockClient() {
  return {
    getOrCreateUser: (u: { id: string }) => u,
    guilds: { get: () => null },
    instance: { endpoints: DEFAULT_INSTANCE_ENDPOINTS, discovery: null },
  } as unknown as Client;
}

describe('Invite', () => {
  describe('guild invite', () => {
    it('exposes guild and channel', () => {
      const invite = new Invite(createMockClient(), {
        code: 'xyz789',
        type: InviteType.Guild,
        guild: { id: 'g1', name: 'Test' },
        channel: { id: 'ch1', name: 'general', type: 0 },
      });
      expect(invite.url).toBe('https://fluxer.gg/xyz789');
      expect(invite.isGuild()).toBe(true);
      expect(invite.guild?.name).toBe('Test');
      expect(invite.channel?.name).toBe('general');
      expect(invite.pack).toBeNull();
    });
  });

  describe('group DM invite', () => {
    it('has channel but no guild', () => {
      const invite = new Invite(createMockClient(), {
        code: 'gdm1',
        type: InviteType.GroupDM,
        channel: { id: 'ch2', name: 'friends', type: 3 },
        member_count: 4,
      });
      expect(invite.isGroupDM()).toBe(true);
      expect(invite.guild).toBeNull();
      expect(invite.channel?.id).toBe('ch2');
      expect(invite.memberCount).toBe(4);
    });
  });

  describe('pack invite', () => {
    it('exposes pack and no channel', () => {
      const invite = new Invite(createMockClient(), {
        code: 'pack1',
        type: InviteType.EmojiPack,
        pack: {
          id: 'p1',
          name: 'Cool Emojis',
          type: 'emoji',
          creator_id: 'u1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          creator: {
            id: 'u1',
            username: 'creator',
            discriminator: '0',
            avatar: null,
            bot: false,
          },
        },
      });
      expect(invite.isPack()).toBe(true);
      expect(invite.pack?.name).toBe('Cool Emojis');
      expect(invite.guild).toBeNull();
      expect(invite.channel).toBeNull();
    });
  });
});
