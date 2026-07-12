import type { APIUserPartial, GatewayPresenceUpdateData } from '@fluxerjs/types';
import { GatewayOpcodes, Routes } from '@fluxerjs/types';

import { User } from '../structures/User.js';
import type { Client } from './Client.js';
import type { PartialUserGuildPayload } from './eventPayloads.js';
import {
  toPresenceWire,
  toSudoBody,
  type PresenceUpdateOptions,
  type SudoVerificationOptions,
} from './sdkOptions.js';

/** The logged-in bot/user (`client.user`). */
export class ClientUser extends User {
  declare readonly client: Client;

  constructor(client: Client, data: APIUserPartial) {
    super(client, data);
  }

  /** Broadcast presence (gateway opcode 3) on all shards. */
  setPresence(presence: PresenceUpdateOptions): void {
    const wire = toPresenceWire(presence) as unknown as GatewayPresenceUpdateData;
    this.client.options.presence = wire;
    this.client._sendToAllShards({ op: GatewayOpcodes.PresenceUpdate, d: wire });
  }

  /** GET /users/@me/guilds — returns camelCase partial guilds. */
  async fetchGuilds(): Promise<PartialUserGuildPayload[]> {
    const data = await this.client.rest.get<
      Array<{
        id: string;
        name: string;
        icon: string | null;
        owner?: boolean;
        permissions?: string | null;
        features?: string[];
      }>
    >(Routes.currentUserGuilds(), { auth: true });
    return data.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon ?? null,
      ...(g.owner !== undefined ? { owner: g.owner } : {}),
      ...(g.permissions !== undefined ? { permissions: g.permissions } : {}),
      ...(g.features !== undefined ? { features: g.features } : {}),
    }));
  }

  /** DELETE /users/@me/guilds/{guild_id} */
  async leaveGuild(guildId: string, options?: SudoVerificationOptions): Promise<void> {
    const body = options ? toSudoBody(options) : undefined;
    await this.client.rest.delete(Routes.leaveGuild(guildId), {
      body: body && Object.keys(body).length ? body : undefined,
      auth: true,
    });
  }

  /** Delete every message authored by the caller across a guild (sudo). */
  async bulkDeleteMyMessagesInGuild(
    guildId: string,
    options?: SudoVerificationOptions,
  ): Promise<void> {
    const body = options ? toSudoBody(options) : undefined;
    await this.client.rest.post(Routes.guildBulkDeleteMine(guildId), {
      body: body && Object.keys(body).length ? body : undefined,
      auth: true,
    });
  }
}
