import type { APIGuildMember, APIUserPartial } from '@fluxerjs/types';
import type { Client } from '../Client.js';
import type { Channel, GuildChannel } from '../../structures/Channel.js';
import type { Guild } from '../../structures/Guild.js';
import type { GuildMember } from '../../structures/GuildMember.js';
import { cacheMember as cacheMemberOnGuild } from '../../structures/guild/cache.js';

export function unknownUser(id: string): APIUserPartial {
  return { id, username: 'Unknown', discriminator: '0' };
}

/** Cache a guild member; returns null if member has no user id. Delegates to guild cache. */
export function cacheMember(
  _client: Client,
  guild: Guild,
  data: APIGuildMember & { guild_id?: string },
): GuildMember | null {
  if (!data.user?.id) return null;
  return cacheMemberOnGuild(guild, data as APIGuildMember & { user: { id: string } });
}

/** Put channel in client + guild channel caches. */
export function cacheChannel(client: Client, channel: Channel): void {
  client.channels.set(channel.id, channel);
  const guildId = 'guildId' in channel ? (channel as GuildChannel).guildId : undefined;
  if (guildId) {
    client.guilds.get(guildId)?.channels.set(channel.id, channel as GuildChannel);
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function num(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
