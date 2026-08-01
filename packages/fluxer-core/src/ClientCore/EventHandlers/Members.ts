import type {
  APIGuildMember,
  GatewayGuildMemberRemoveDispatchData,
  GatewayGuildMembersChunkDispatchData,
} from '@fluxerjs/types';
import { GuildMember } from '../../Domain/Guild/GuildMember.js';
import { Events } from '../../Helpers/Events.js';

import type { GuildMembersChunkPayload } from '../EventPayloads.js';

import { indexMember, unknownUser } from './Helpers.js';

import type { HandlerMap } from './Types.js';

export const memberHandlers: HandlerMap = {
  GUILD_MEMBER_ADD(client, d) {
    const data = d as APIGuildMember & { guild_id: string };

    const guild = client.guilds.get(data.guild_id);

    if (!guild) return;

    const userId = data.user?.id;
    const alreadyCached = userId != null && guild.members.has(userId);
    const member = indexMember(client, guild, data);

    if (!member) return;
    if (!alreadyCached) guild.adjustMemberCount(1);
    client.emit(Events.GuildMemberAdd, member);
  },

  GUILD_MEMBER_UPDATE(client, d) {
    const data = d as APIGuildMember & { guild_id: string };

    const guild = client.guilds.get(data.guild_id);

    if (!guild) return;

    const existing = guild.members.get(data.user.id);

    const oldM = existing?._clone() ?? null;

    const newM = indexMember(client, guild, data)!;

    client.emit(Events.GuildMemberUpdate, oldM, newM);
  },

  GUILD_MEMBER_REMOVE(client, d) {
    const data = d as GatewayGuildMemberRemoveDispatchData;

    const guild = client.guilds.get(data.guild_id);

    if (!guild || !data.user?.id) return;

    let member = guild.members.get(data.user.id);

    if (member) {
      guild.members.delete(data.user.id);
    } else {
      member = new GuildMember(
        client,

        {
          user: {
            ...unknownUser(data.user.id),

            ...data.user,

            username: data.user.username ?? 'Unknown',

            discriminator: data.user.discriminator ?? '0',
          },

          roles: [],

          joined_at: new Date(0).toISOString(),

          nick: null,

          mute: false,

          deaf: false,
        },

        guild,
      );
    }

    // Leave events are authoritative even when the member was not cached.
    guild.adjustMemberCount(-1);
    client.emit(Events.GuildMemberRemove, member);
  },

  GUILD_MEMBERS_CHUNK(client, d) {
    const data = d as GatewayGuildMembersChunkDispatchData;

    const guild = client.guilds.get(data.guild_id);

    const members = [];

    if (guild) {
      for (const m of data.members ?? []) {
        const member = indexMember(client, guild, m);

        if (member) members.push(member);
      }
    }

    const payload: GuildMembersChunkPayload = {
      guildId: data.guild_id,

      members,

      chunkIndex: data.chunk_index,

      chunkCount: data.chunk_count,

      notFound: [],

      nonce: data.nonce ?? null,
    };

    client.emit(Events.GuildMembersChunk, payload);
  },
};
