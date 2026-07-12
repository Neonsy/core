import type { APIChannel, APIEmoji, APIGuildMember, APIRole, APISticker } from '@fluxerjs/types';
import { Channel } from '../Channel.js';
import type { GuildChannel } from '../Channel.js';
import { GuildEmoji } from '../GuildEmoji.js';
import { GuildMember } from '../GuildMember.js';
import { GuildSticker } from '../GuildSticker.js';
import { Role } from '../Role.js';
import type { Guild } from './Guild.js';

export function cacheChannel(guild: Guild, data: APIChannel): GuildChannel | null {
  const channel = Channel.from(guild.client, data);
  if (!channel) return null;
  guild.client.channels.set(channel.id, channel);
  guild.channels.set(channel.id, channel as GuildChannel);
  return channel as GuildChannel;
}

export function cacheMember(
  guild: Guild,
  data: APIGuildMember & { user: { id: string } },
): GuildMember {
  const existing = guild.members.get(data.user.id);
  if (existing) {
    existing._patch(data);
    return existing;
  }
  const member = new GuildMember(guild.client, { ...data, guild_id: guild.id }, guild);
  guild.members.set(member.id, member);
  return member;
}

export function cacheRole(guild: Guild, data: APIRole): Role {
  const existing = guild.roles.get(data.id);
  if (existing) {
    existing._patch(data);
    return existing;
  }
  const role = new Role(guild.client, data, guild.id);
  guild.roles.set(role.id, role);
  return role;
}

/** Cache roles from a bulk REST response; returns structure instances. */
export function replaceRoles(guild: Guild, data: APIRole[]): Role[] {
  return data.map((r) => cacheRole(guild, r));
}

export function cacheEmoji(guild: Guild, data: APIEmoji): GuildEmoji {
  const emoji = new GuildEmoji(guild.client, { ...data, guild_id: guild.id }, guild.id);
  guild.emojis.set(emoji.id, emoji);
  return emoji;
}

export function cacheSticker(guild: Guild, data: APISticker): GuildSticker {
  const sticker = new GuildSticker(guild.client, { ...data, guild_id: guild.id }, guild.id);
  guild.stickers.set(sticker.id, sticker);
  return sticker;
}
