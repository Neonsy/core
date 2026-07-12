import { Collection } from '@fluxerjs/collection';
import { type APIGuildMember, type APIGuildMemberSearchResponse, Routes } from '@fluxerjs/types';
import type { Guild } from '../structures/Guild.js';
import { GuildMember } from '../structures/GuildMember.js';
import type { GuildMemberSearchPayload } from './eventPayloads.js';
import { toMemberSearchBody, type GuildMemberSearchOptions } from './sdkOptions.js';

/**
 * Manages guild members with a Collection-like API.
 * Extends Collection so you can use .get(), .set(), .filter(), etc.
 *
 */
export class GuildMemberManager extends Collection<string, GuildMember> {
  constructor(private readonly guild: Guild) {
    super();
  }

  /**
   * Cache a member with optional FIFO eviction when `options.cache.members` is set.
   */
  override set(key: string, value: GuildMember): this {
    const limit = this.guild.client.options.cache?.members ?? 0;
    if (limit > 0 && !this.has(key) && this.size >= limit) {
      const oldest = this.keys().next().value;
      if (oldest !== undefined) this.delete(oldest);
    }
    return super.set(key, value);
  }

  /**
   * Get a guild member from cache or fetch from the API if not present.
   * Convenience helper to avoid repeating `guild.members.get(userId) ?? (await guild.fetchMember(userId))`.
   * @param userId - Snowflake of the user
   * @returns The guild member
   * @throws FluxerError with MEMBER_NOT_FOUND if user is not in the guild (404)
   * @example
   * const member = await guild.members.resolve(userId);
   * console.log(member.displayName);
   */
  async resolve(userId: string): Promise<GuildMember> {
    return this.get(userId) ?? this.guild.fetchMember(userId);
  }

  /**
   * The current bot user as a GuildMember in this guild.
   * Returns null if the bot's member is not cached or client.user is null.
   * Use fetchMe() to load the bot's member when not cached.
   *
   * @example
   * const perms = guild.members.me?.permissions;
   * if (perms?.has(PermissionFlags.BanMembers)) { ... }
   */
  get me(): GuildMember | null {
    const userId = this.guild.client.user?.id;
    return userId ? (this.get(userId) ?? null) : null;
  }

  /**
   * Fetch the current bot user as a GuildMember in this guild.
   * Caches the result in guild.members.
   *
   * @throws FluxerError with CLIENT_NOT_READY if client.user is null
   * @example
   * const me = await guild.members.fetchMe();
   * console.log(me.displayName);
   */
  async fetchMe(): Promise<GuildMember> {
    return this.guild.fetchMe();
  }

  /**
   * Remove members matching a filter (or all if omitted). Returns count removed.
   */
  sweep(filter?: (member: GuildMember, id: string) => boolean): number {
    let removed = 0;
    for (const [id, member] of this) {
      if (!filter || filter(member, id)) {
        this.delete(id);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Fetch guild members with pagination. GET /guilds/{id}/members.
   * @param options - limit (1-1000), after (user ID for pagination)
   * @returns Array of GuildMember objects (cached in guild.members)
   */
  async fetch(options?: { limit?: number; after?: string }): Promise<GuildMember[]> {
    const params = new URLSearchParams();
    if (options?.limit != null) params.set('limit', String(options.limit));
    if (options?.after) params.set('after', options.after);
    const qs = params.toString();
    const url = Routes.guildMembers(this.guild.id) + (qs ? `?${qs}` : '');
    const data = await this.guild.client.rest.get<APIGuildMember[]>(url, { auth: true });
    const members: GuildMember[] = [];
    for (const m of data) {
      const member = new GuildMember(
        this.guild.client,
        { ...m, guild_id: this.guild.id },
        this.guild,
      );
      this.set(member.id, member);
      members.push(member);
    }
    return members;
  }

  /**
   * Search guild members. POST /guilds/{id}/members-search.
   * @param options - CamelCase search query, filters, and pagination
   * @returns CamelCase search results; `member` is set from cache when present
   * @example
   * const { members } = await guild.members.search({ query: 'alex', limit: 25 });
   */
  async search(options: GuildMemberSearchOptions = {}): Promise<GuildMemberSearchPayload> {
    const data = await this.guild.client.rest.post<APIGuildMemberSearchResponse>(
      Routes.guildMembersSearch(this.guild.id),
      { body: toMemberSearchBody(options), auth: true },
    );
    const offset = options.offset ?? 0;
    const members = data.members.map((hit) => ({
      id: hit.id,
      guildId: hit.guild_id,
      userId: hit.user_id,
      username: hit.username,
      discriminator: hit.discriminator,
      globalName: hit.global_name,
      nickname: hit.nickname,
      member: this.get(hit.user_id) ?? null,
    }));
    return {
      guildId: data.guild_id,
      members,
      total: data.total_result_count,
      pageResultCount: data.page_result_count,
      hasMore: offset + members.length < data.total_result_count,
      indexing: data.indexing,
    };
  }
}
