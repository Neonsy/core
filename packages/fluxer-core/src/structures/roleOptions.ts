import { resolvePermissionsToBitfield, type PermissionResolvable } from '@fluxerjs/util';

/**
 * CamelCase options for creating a guild role.
 * Serialized to snake_case wire fields before REST.
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

/** Convert SDK role options to an OpenAPI role body. */
export function toRoleRequestBody(options: RoleCreateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.color !== undefined) body.color = options.color;
  if (options.hoist !== undefined) body.hoist = options.hoist;
  if (options.mentionable !== undefined) body.mentionable = options.mentionable;
  if (options.unicodeEmoji !== undefined) body.unicode_emoji = options.unicodeEmoji;
  if (options.position !== undefined) body.position = options.position;
  if (options.hoistPosition !== undefined) body.hoist_position = options.hoistPosition;
  if (options.permissions !== undefined) {
    body.permissions =
      typeof options.permissions === 'string'
        ? options.permissions
        : resolvePermissionsToBitfield(options.permissions);
  }
  return body;
}
