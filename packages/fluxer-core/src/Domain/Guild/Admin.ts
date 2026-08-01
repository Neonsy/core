import type {
  APIDiscoveryApplication,
  APIDiscoveryStatus,
  APIGuild,
  APIGuildAuditLog,
  APIVanityURL,
  AuditLogActionType,
} from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import type {
  AuditLogEntryPayload,
  AuditLogFetchPayload,
  VanityURLPayload,
} from '../../ClientCore/EventPayloads.js';
import { toGuildEditBody } from '../../ClientCore/SdkOptions/Guild.js';
import {
  type DiscoveryApplicationOptions,
  type DiscoveryApplicationPayload,
  type DiscoveryStatusPayload,
  type SudoVerificationOptions,
  toDiscoveryApplicationPayload,
  toDiscoveryBody,
  toDiscoveryStatusPayload,
  toSudoBody,
} from '../../ClientCore/SdkOptions/index.js';
import { qs } from '../../Helpers/HttpErrors.js';
import type { Guild } from './Guild.js';
import type { GuildEditOptions } from './Types.js';

function toAuditLogEntryPayload(
  entry: APIGuildAuditLog['audit_log_entries'][number],
  guildId: string,
): AuditLogEntryPayload {
  return {
    id: entry.id,
    actionType: entry.action_type,
    userId: entry.user_id ?? null,
    targetId: entry.target_id ?? null,
    reason: entry.reason ?? null,
    options: entry.options ?? null,
    changes: (entry.changes ?? []).map((c) => ({
      key: c.key,
      oldValue: c.old_value,
      newValue: c.new_value,
    })),
    guildId,
  };
}

function toVanityPayload(data: APIVanityURL): VanityURLPayload {
  return { code: data.code ?? null, uses: data.uses };
}

export async function fetchAuditLogs(
  guild: Guild,
  options?: {
    limit?: number;
    before?: string;
    after?: string;
    userId?: string;
    actionType?: AuditLogActionType;
  },
): Promise<AuditLogFetchPayload> {
  const url =
    Routes.guildAuditLogs(guild.id) +
    qs({
      limit: options?.limit,
      before: options?.before,
      after: options?.after,
      user_id: options?.userId,
      action_type: options?.actionType,
    });
  const data = await guild.client.rest.get<APIGuildAuditLog>(url);
  return {
    entries: data.audit_log_entries.map((e) => toAuditLogEntryPayload(e, guild.id)),
    users: data.users.map((u) =>
      guild.client.getOrCreateUser({
        id: u.id,
        username: u.username ?? 'Unknown',
        discriminator: u.discriminator ?? '0',
        global_name: null,
        avatar: u.avatar ?? null,
        avatar_color: null,
        flags: 0,
      }),
    ),
  };
}

export async function editGuild(guild: Guild, options: GuildEditOptions): Promise<Guild> {
  const data = await guild.client.rest.patch<APIGuild>(Routes.guild(guild.id), {
    body: toGuildEditBody(options),
    auth: true,
  });
  guild._patch(data);
  return guild;
}

export async function fetchVanityURL(guild: Guild): Promise<VanityURLPayload> {
  const data = await guild.client.rest.get<APIVanityURL>(Routes.guildVanityUrl(guild.id), {
    auth: true,
  });
  return toVanityPayload(data);
}

export async function editVanityURL(guild: Guild, code: string | null): Promise<VanityURLPayload> {
  const data = await guild.client.rest.patch<APIVanityURL>(Routes.guildVanityUrl(guild.id), {
    body: { code },
    auth: true,
  });
  guild.vanityURLCode = data.code ?? null;
  return toVanityPayload(data);
}

export async function fetchDiscoveryStatus(guild: Guild): Promise<DiscoveryStatusPayload> {
  const data = await guild.client.rest.get<APIDiscoveryStatus>(Routes.guildDiscovery(guild.id), {
    auth: true,
  });
  return toDiscoveryStatusPayload(data);
}

export async function applyForDiscovery(
  guild: Guild,
  options: DiscoveryApplicationOptions,
): Promise<DiscoveryApplicationPayload> {
  const data = await guild.client.rest.post<APIDiscoveryApplication>(
    Routes.guildDiscovery(guild.id),
    {
      body: toDiscoveryBody(options),
      auth: true,
    },
  );
  return toDiscoveryApplicationPayload(data);
}

export async function editDiscoveryApplication(
  guild: Guild,
  options: DiscoveryApplicationOptions,
): Promise<DiscoveryApplicationPayload> {
  const data = await guild.client.rest.patch<APIDiscoveryApplication>(
    Routes.guildDiscovery(guild.id),
    {
      body: toDiscoveryBody(options),
      auth: true,
    },
  );
  return toDiscoveryApplicationPayload(data);
}

export async function withdrawDiscoveryApplication(guild: Guild): Promise<void> {
  await guild.client.rest.delete(Routes.guildDiscovery(guild.id), { auth: true });
}

export async function deleteGuild(guild: Guild, options?: SudoVerificationOptions): Promise<void> {
  const body = options ? toSudoBody(options) : {};
  await guild.client.rest.post(Routes.guildDelete(guild.id), {
    body,
    auth: true,
  });
  guild.client.guilds.delete(guild.id);
}

export async function transferOwnership(
  guild: Guild,
  newOwnerId: string,
  password?: string,
): Promise<void> {
  await guild.client.rest.post(Routes.guildTransferOwnership(guild.id), {
    body: { new_owner_id: newOwnerId, ...(password != null && { password }) },
    auth: true,
  });
}
