import type { APIUser } from './user.js';

/** Guild ban from GET /guilds/{id}/bans. */
export interface APIBan {
  /** Banned user. */
  user: APIUser;
  /** Ban reason (null if no reason provided). */
  reason: string | null;
  /** ISO-8601 timestamp when a temporary ban expires (null for permanent bans). */
  expires_at?: string | null;
}
