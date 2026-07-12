import type { APIBan } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { GuildBan } from '../GuildBan.js';
import type { Guild } from './Guild.js';
import type { GuildBanOptions } from './types.js';
import { toGuildBanBody } from './types.js';

export async function ban(guild: Guild, userId: string, options?: GuildBanOptions): Promise<void> {
  const body = options ? toGuildBanBody(options) : {};
  await guild.client.rest.put(Routes.guildBan(guild.id, userId), {
    body: Object.keys(body).length ? body : undefined,
    auth: true,
  });
}

export async function fetchBans(guild: Guild): Promise<GuildBan[]> {
  const data = await guild.client.rest.get<APIBan[]>(Routes.guildBans(guild.id));
  return data.map((b) => new GuildBan(guild.client, { ...b, guild_id: guild.id }, guild.id));
}

export async function unban(guild: Guild, userId: string): Promise<void> {
  await guild.client.rest.delete(Routes.guildBan(guild.id, userId), { auth: true });
}

export async function kick(guild: Guild, userId: string): Promise<void> {
  await guild.client.rest.delete(Routes.guildMember(guild.id, userId), { auth: true });
}
