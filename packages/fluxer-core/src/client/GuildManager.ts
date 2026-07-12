import { Collection } from '@fluxerjs/collection';
import { type APIGuild, Routes } from '@fluxerjs/types';
import { FluxerAPIError, RateLimitError } from '@fluxerjs/rest';
import type { Client } from './Client.js';
import { Guild } from '../structures/Guild.js';
import { FluxerError } from '../errors/FluxerError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';

/**
 * Guild cache and manager with fetch.
 * Extends {@link Collection} so you can use `.get()`, `.set()`, `.filter()`, etc.
 */
export class GuildManager extends Collection<string, Guild> {
  private readonly maxSize: number;

  constructor(private readonly client: Client) {
    super();
    this.maxSize = client.options?.cache?.guilds ?? 0;
  }

  /** Set a guild in the cache (evicts oldest if at capacity). */
  override set(key: string, value: Guild): this {
    if (this.maxSize > 0 && this.size >= this.maxSize && !this.has(key)) {
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) this.delete(firstKey);
    }
    return super.set(key, value);
  }

  /**
   * Get a guild from cache or fetch from the API if not present.
   * @param guildId - Snowflake of the guild
   * @returns The guild
   * @throws FluxerError with GUILD_NOT_FOUND if missing
   */
  async resolve(guildId: string): Promise<Guild> {
    return this.get(guildId) ?? this.fetch(guildId);
  }

  /**
   * Fetch a guild by ID (returns cache if present).
   * @throws FluxerError with GUILD_NOT_FOUND if missing
   */
  async fetch(guildId: string): Promise<Guild> {
    const cached = this.get(guildId);
    if (cached) return cached;

    try {
      const data = await this.client.rest.get<APIGuild>(Routes.guild(guildId));
      const guild = new Guild(this.client, data);
      this.set(guild.id, guild);
      return guild;
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      if (err instanceof FluxerAPIError && err.statusCode === 404) {
        throw new FluxerError(`Guild ${guildId} not found`, {
          code: ErrorCodes.GuildNotFound,
          cause: err,
        });
      }
      throw err instanceof FluxerError
        ? err
        : new FluxerError(String(err), { cause: err as Error });
    }
  }
}
