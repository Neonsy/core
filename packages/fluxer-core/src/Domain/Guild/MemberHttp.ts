import type { APIGuildMember } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { rethrowMapped } from '../../Helpers/HttpErrors.js';
import { ErrorCodes } from '../../LibErrors/ErrorCodes.js';
import { cacheMember } from './Cache.js';
import type { Guild } from './Guild.js';
import type { GuildMember } from './GuildMember.js';

export async function fetchMember(guild: Guild, userId: string): Promise<GuildMember> {
  try {
    const data = await guild.client.rest.get<APIGuildMember & { user: { id: string } }>(
      Routes.guildMember(guild.id, userId),
    );
    return cacheMember(guild, data);
  } catch (err) {
    rethrowMapped(err, {
      notFound: {
        code: ErrorCodes.MemberNotFound,
        message: `Member ${userId} not found in guild`,
      },
      fallback: 'Failed to fetch guild member',
    });
  }
}

export async function fetchMe(guild: Guild): Promise<GuildMember> {
  const data = await guild.client.rest.get<APIGuildMember & { user: { id: string } }>(
    Routes.guildMemberMe(guild.id),
    { auth: true },
  );
  return cacheMember(guild, data);
}
