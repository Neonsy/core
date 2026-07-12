import type {
  APIBan,
  APISticker,
  GatewayGuildAuditLogEntryCreateDispatchData,
  GatewayGuildBanAddDispatchData,
  GatewayGuildBanRemoveDispatchData,
  GatewayGuildRoleCreateDispatchData,
  GatewayGuildRoleDeleteDispatchData,
  GatewayGuildRoleUpdateDispatchData,
  GatewayGuildStickersUpdateDispatchData,
} from '@fluxerjs/types';

import { Events } from '../../util/Events.js';

import { GuildBan } from '../../structures/GuildBan.js';

import { GuildEmoji } from '../../structures/GuildEmoji.js';

import { GuildSticker } from '../../structures/GuildSticker.js';

import { Role } from '../../structures/Role.js';

import type {
  AuditLogEntryPayload,
  GuildRoleDeletePayload,
  GuildStickersUpdatePayload,
} from '../eventPayloads.js';

import type { HandlerMap } from './types.js';

function toAuditLogEntry(data: GatewayGuildAuditLogEntryCreateDispatchData): AuditLogEntryPayload {
  return {
    id: data.id,

    actionType: data.action_type,

    userId: data.user_id ?? null,

    targetId: data.target_id ?? null,

    reason: data.reason ?? null,

    options: data.options ?? null,

    changes: (data.changes ?? []).map((c) => ({
      key: c.key,

      oldValue: c.old_value,

      newValue: c.new_value,
    })),

    guildId: data.guild_id ?? null,
  };
}

export const guildResourceHandlers: HandlerMap = {
  GUILD_EMOJIS_UPDATE(client, d) {
    const data = d as {
      guild_id: string;

      emojis: Array<{ id: string; name?: string; animated?: boolean }>;
    };

    const guild = client.guilds.get(data.guild_id);

    if (guild) {
      guild.emojis.clear();

      for (const e of data.emojis ?? []) {
        if (!e.id || e.name == null) continue;

        guild.emojis.set(
          e.id,

          new GuildEmoji(
            client,

            { id: e.id, name: e.name, animated: e.animated ?? false, guild_id: guild.id },

            guild.id,
          ),
        );
      }
    }

    client.emit(Events.GuildEmojisUpdate, {
      guildId: data.guild_id,

      emojis: guild ? [...guild.emojis.values()] : [],
    });
  },

  GUILD_STICKERS_UPDATE(client, d) {
    const data = d as GatewayGuildStickersUpdateDispatchData;

    const guild = client.guilds.get(data.guild_id);

    if (guild) {
      guild.stickers.clear();

      for (const s of data.stickers ?? []) {
        const sticker = new GuildSticker(
          client,
          { ...s, guild_id: guild.id } as APISticker,
          guild.id,
        );

        guild.stickers.set(sticker.id, sticker);
      }
    }

    const payload: GuildStickersUpdatePayload = {
      guildId: data.guild_id,

      stickers: guild ? [...guild.stickers.values()] : [],
    };

    client.emit(Events.GuildStickersUpdate, payload);
  },

  GUILD_ROLE_CREATE(client, d) {
    const data = d as GatewayGuildRoleCreateDispatchData;

    const guild = client.guilds.get(data.guild_id);

    const role = new Role(client, data.role, data.guild_id);

    if (guild) guild.roles.set(role.id, role);

    client.emit(Events.GuildRoleCreate, role);
  },

  GUILD_ROLE_UPDATE(client, d) {
    const data = d as GatewayGuildRoleUpdateDispatchData;

    const guild = client.guilds.get(data.guild_id);

    let role = guild?.roles.get(data.role.id);

    const oldRole = role ? role._clone() : null;

    if (role) role._patch(data.role);
    else {
      role = new Role(client, data.role, data.guild_id);

      guild?.roles.set(role.id, role);
    }

    client.emit(Events.GuildRoleUpdate, { role, oldRole });
  },

  GUILD_ROLE_DELETE(client, d) {
    const data = d as GatewayGuildRoleDeleteDispatchData;

    const guild = client.guilds.get(data.guild_id);

    const role = guild?.roles.get(data.role_id) ?? null;

    guild?.roles.delete(data.role_id);

    client.emit(Events.GuildRoleDelete, {
      roleId: data.role_id,
      guildId: data.guild_id,
      role,
    } satisfies GuildRoleDeletePayload);
  },

  GUILD_BAN_ADD(client, d) {
    const data = d as GatewayGuildBanAddDispatchData;

    const banData: APIBan & { guild_id?: string } = {
      user: data.user,

      reason: data.reason ?? null,

      guild_id: data.guild_id,
    };

    client.emit(Events.GuildBanAdd, new GuildBan(client, banData, data.guild_id));
  },

  GUILD_BAN_REMOVE(client, d) {
    const data = d as GatewayGuildBanRemoveDispatchData;

    client.emit(
      Events.GuildBanRemove,
      new GuildBan(client, { ...data, reason: null }, data.guild_id),
    );
  },

  GUILD_AUDIT_LOG_ENTRY_CREATE(client, d) {
    client.emit(
      Events.GuildAuditLogEntryCreate,

      toAuditLogEntry(d as GatewayGuildAuditLogEntryCreateDispatchData),
    );
  },
};
