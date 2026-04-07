import type { APIApplicationCommandInteraction } from '@fluxerjs/types';
import type { Client } from '../../client/Client.js';

/**
 * Gateway interaction wrapper with `client` and raw API payload.
 * Use {@link ChatInputCommandInteraction} for slash commands (`data.name` present).
 */
export class BaseInteraction {
  constructor(
    public readonly client: Client,
    public readonly raw: APIApplicationCommandInteraction,
  ) {}

  get id(): string {
    return this.raw.id;
  }

  get applicationId(): string {
    return this.raw.application_id;
  }

  get token(): string {
    return this.raw.token;
  }

  get type(): number {
    return this.raw.type;
  }

  get channelId(): string | undefined {
    return this.raw.channel_id;
  }

  get guildId(): string | undefined {
    return this.raw.guild_id;
  }
}
