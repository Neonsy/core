import type { APIGuildMember } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import type { GuildMember } from '../GuildMember.js';
import { cacheMember } from './cache.js';
import type { Guild } from './Guild.js';
import { rethrowNotFound } from './http.js';

export async function fetchMember(guild: Guild, userId: string): Promise<GuildMember> {
  try {
    const data = await guild.client.rest.get<APIGuildMember & { user: { id: string } }>(
      Routes.guildMember(guild.id, userId),
    );
    return cacheMember(guild, data);
  } catch (err) {
    rethrowNotFound(
      err,
      { code: ErrorCodes.MemberNotFound, message: `Member ${userId} not found in guild` },
      'Failed to fetch guild member',
    );
  }
}

export async function fetchMe(guild: Guild): Promise<GuildMember> {
  const data = await guild.client.rest.get<APIGuildMember & { user: { id: string } }>(
    Routes.guildMemberMe(guild.id),
    { auth: true },
  );
  return cacheMember(guild, data);
}
