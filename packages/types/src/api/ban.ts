import type { APIUser } from './User.js';

/** Guild ban from GET /guilds/{id}/bans. */
export interface APIBan {
  /** Banned user. */
  user: APIUser;
  /** Ban reason (null if no reason provided). */
  reason?: string | null;
  /** Moderator who issued the ban (REST ban list). */
  moderator_id?: string;
  /** ISO-8601 timestamp when the ban was issued (REST ban list). */
  banned_at?: string;
  /** ISO-8601 timestamp when a temporary ban expires (null for permanent bans). */
  expires_at?: string | null;
}
