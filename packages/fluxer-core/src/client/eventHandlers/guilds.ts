import type {
  APIChannel,
  APIGuild,
  APIGuildMember,
  GatewayVoiceStateUpdateDispatchData,
} from '@fluxerjs/types';
import { Events } from '../../util/Events.js';
import { normalizeGuildPayload } from '../../util/guildUtils.js';
import { Channel, type GuildChannel } from '../../structures/Channel.js';
import { Guild } from '../../structures/Guild.js';
import { cacheMember } from './helpers.js';
import type { HandlerMap } from './types.js';

export const guildHandlers: HandlerMap = {
  GUILD_CREATE(client, d) {
    const guildData = normalizeGuildPayload(d as unknown);
    if (!guildData) return;

    const guild = new Guild(client, guildData);
    client.guilds.set(guild.id, guild);

    const g = d as APIGuild & {
      channels?: APIChannel[];
      voice_states?: GatewayVoiceStateUpdateDispatchData[];
      members?: Array<APIGuildMember & { user: { id: string } }>;
    };

    for (const ch of g.channels ?? []) {
      const channel = Channel.from(client, ch);
      if (channel) {
        client.channels.set(channel.id, channel);
        guild.channels.set(channel.id, channel as GuildChannel);
      }
    }
    for (const m of g.members ?? []) cacheMember(client, guild, m);

    client.emit(Events.GuildCreate, guild);
    if (g.voice_states?.length) {
      client.emit(Events.VoiceStatesSync, { guildId: guild.id, voiceStates: g.voice_states });
    }
    client._onGuildReceived(guild.id);
  },

  GUILD_UPDATE(client, d) {
    const guildData = normalizeGuildPayload(d as unknown);
    if (!guildData) return;

    const existing = client.guilds.get(guildData.id);
    if (existing) {
      const oldSnapshot = Object.assign(Object.create(Object.getPrototypeOf(existing)), existing);
      existing._patch(guildData);
      client.emit(Events.GuildUpdate, oldSnapshot, existing);
      return;
    }

    const updated = new Guild(client, guildData);
    client.guilds.set(updated.id, updated);
    client.emit(Events.GuildUpdate, updated, updated);
  },

  GUILD_DELETE(client, d) {
    const { id } = d as { id: string };
    const guild = client.guilds.get(id);
    if (!guild) return;
    client.guilds.delete(id);
    client.emit(Events.GuildDelete, guild);
  },
};
