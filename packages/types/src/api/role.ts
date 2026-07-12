import type { Snowflake } from '../common/snowflake.js';

/**
 * Role from GET /guilds/{id}/roles.
 * `permissions` is a bitfield as string (e.g. "8933636165185").
 */
export interface APIRole {
  /** Role ID. */
  id: Snowflake;
  /** Role name. */
  name: string;
  /** Role color as RGB integer. */
  color: number;
  /** Sort position in the role list. */
  position: number;
  /** Hoisted position (displayed separately in member list). */
  hoist_position?: number | null;
  /** Permissions bitfield as string. */
  permissions: string;
  /** Whether the role is hoisted (displayed separately). */
  hoist: boolean;
  /** Whether the role can be mentioned. */
  mentionable: boolean;
  /** Unicode emoji for the role (if no custom icon). */
  unicode_emoji?: string | null;
}

/** Request body for POST /guilds/{id}/roles (create role). All fields optional. */
export interface RESTCreateRoleBody {
  /** Role name. */
  name?: string;
  /** Permissions bitfield as string. */
  permissions?: string;
  /** Role color as RGB integer. */
  color?: number;
  /** Whether the role is hoisted. */
  hoist?: boolean;
  /** Whether the role can be mentioned. */
  mentionable?: boolean;
  /** Unicode emoji for the role. */
  unicode_emoji?: string | null;
  /** Sort position. */
  position?: number;
  /** Hoisted position. */
  hoist_position?: number | null;
}

/** Request body for PATCH /guilds/{id}/roles/{roleId} (update role). All fields optional. */
export interface RESTUpdateRoleBody {
  /** Role name. */
  name?: string;
  /** Permissions bitfield as string. */
  permissions?: string;
  /** Role color as RGB integer. */
  color?: number;
  /** Whether the role is hoisted. */
  hoist?: boolean;
  /** Whether the role can be mentioned. */
  mentionable?: boolean;
  /** Unicode emoji for the role. */
  unicode_emoji?: string | null;
  /** Sort position. */
  position?: number;
  /** Hoisted position. */
  hoist_position?: number | null;
}
