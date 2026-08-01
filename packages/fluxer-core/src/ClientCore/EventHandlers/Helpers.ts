import type { APIGuildMember, APIUserPartial } from '@fluxerjs/types';
import { asRecord, num, str } from '@fluxerjs/util';
import type { Channel } from '../../Domain/Channel/index.js';
import { putChannel, cacheMember as upsertGuildMember } from '../../Domain/Guild/Cache.js';
import type { Guild } from '../../Domain/Guild/Guild.js';
import type { GuildMember } from '../../Domain/Guild/GuildMember.js';
import type { Client } from '../Client.js';

export { asRecord, num, str };

export function unknownUser(id: string): APIUserPartial {
  return {
    id,
    username: 'Unknown',
    discriminator: '0',
    global_name: null,
    avatar: null,
    avatar_color: null,
    flags: 0,
  };
}

/** Upsert a guild member from API data; returns null if member has no user id. */
export function indexMember(
  _client: Client,
  guild: Guild,
  data: APIGuildMember & { guild_id?: string },
): GuildMember | null {
  if (!data.user?.id) return null;
  return upsertGuildMember(guild, data as APIGuildMember & { user: { id: string } });
}

/** Put an existing channel instance into client + guild channel caches. */
export function indexChannel(client: Client, channel: Channel): void {
  putChannel(client, channel);
}
