import { Collection } from '@fluxerjs/collection';
import {
  Routes,
  type APIUserPartial,
  type APIProfileResponse,
  type APIGuildMember,
} from '@fluxerjs/types';
import type { Client } from './Client.js';
import { toProfilePayload, type ProfilePayload } from './sdkOptions.js';
import type { User } from '../structures/User.js';
import type { GuildMember } from '../structures/GuildMember.js';
import { cacheMember } from '../structures/guild/cache.js';

type MemberPayload = APIGuildMember & { user: { id: string } };

const soft = <T>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

/** Result of {@link UserManager.fetchWithProfile}. */
export interface FetchedUserWithProfile {
  user: User;
  userData: APIUserPartial;
  globalProfile: ProfilePayload | null;
  serverProfile: ProfilePayload | null;
  member: GuildMember | null;
  memberData: MemberPayload | null;
}

/**
 * User cache + fetch/profile helpers.
 * Extends Collection (`.get()`, `.set()`, `.filter()`, …).
 * Access via {@link Client.users}.
 */
export class UserManager extends Collection<string, User> {
  private readonly maxSize: number;

  constructor(private readonly client: Client) {
    super();
    this.maxSize = client.options?.cache?.users ?? 0;
  }

  override set(key: string, value: User): this {
    if (this.maxSize > 0 && this.size >= this.maxSize && !this.has(key)) {
      const oldest = this.keys().next().value;
      if (oldest !== undefined) this.delete(oldest);
    }
    return super.set(key, value);
  }

  /** Remove matching users (skips `client.user`). Returns count removed. */
  sweep(filter?: (user: User, id: string) => boolean): number {
    let removed = 0;
    const selfId = this.client.user?.id;
    for (const [id, user] of this) {
      if (id === selfId) continue;
      if (!filter || filter(user, id)) {
        this.delete(id);
        removed++;
      }
    }
    return removed;
  }

  /** Fetch a user by ID and update cache. */
  async fetch(userId: string): Promise<User> {
    const data = await this.client.rest.get<APIUserPartial>(Routes.user(userId));
    return this.client.getOrCreateUser(data);
  }

  /**
   * Fetch user + profiles (+ optional guild member). Ideal for userinfo commands.
   * @example
   * const { user, globalProfile, member } = await client.users.fetchWithProfile(
   *   userId,
   *   { guildId: message.guildId ?? undefined },
   * );
   */
  async fetchWithProfile(
    userId: string,
    options?: { guildId?: string | null },
  ): Promise<FetchedUserWithProfile> {
    const guildId = options?.guildId ?? undefined;

    const [userData, globalProfileRaw, serverProfileRaw, memberData] = await Promise.all([
      this.client.rest.get<APIUserPartial>(Routes.user(userId)),
      soft<APIProfileResponse>(this.client.rest.get(Routes.userProfile(userId))),
      guildId
        ? soft<APIProfileResponse>(this.client.rest.get(Routes.userProfile(userId, guildId)))
        : null,
      guildId
        ? soft<MemberPayload>(this.client.rest.get(Routes.guildMember(guildId, userId)))
        : null,
    ]);

    const user = this.client.getOrCreateUser(userData);

    let member: GuildMember | null = null;
    if (memberData && guildId) {
      let guild = this.client.guilds.get(guildId);
      if (!guild) {
        try {
          guild = await this.client.guilds.fetch(guildId);
        } catch {
          guild = undefined;
        }
      }
      if (guild) {
        member = cacheMember(guild, memberData);
      }
    }

    return {
      user,
      userData,
      globalProfile: globalProfileRaw ? toProfilePayload(globalProfileRaw) : null,
      serverProfile: serverProfileRaw ? toProfilePayload(serverProfileRaw) : null,
      member,
      memberData,
    };
  }
}
