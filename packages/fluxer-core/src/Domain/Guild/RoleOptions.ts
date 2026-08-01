import type { PermissionResolvable } from '@fluxerjs/util';

/**
 * CamelCase options for creating a guild role.
 * Serialized to snake_case wire fields before REST via {@link toRoleRequestBody}.
 */
export interface RoleCreateOptions {
  /** Role name. */
  name?: string;
  /** Permissions bitfield string or {@link PermissionResolvable}. */
  permissions?: string | PermissionResolvable;
  /** Role color as 24-bit RGB. */
  color?: number;
  /** Whether the role is displayed separately in the member list. */
  hoist?: boolean;
  /** Whether the role can be @mentioned. */
  mentionable?: boolean;
  /** Unicode emoji for the role. */
  unicodeEmoji?: string | null;
  /** Sort position in the role list. */
  position?: number;
  /** Hoisted position (visual separator group). */
  hoistPosition?: number | null;
}

/**
 * CamelCase options for editing a guild role.
 * Serialized to snake_case wire fields before REST.
 */
export type RoleEditOptions = RoleCreateOptions;
