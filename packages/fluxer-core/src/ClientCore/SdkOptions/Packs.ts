/** Pack create/edit/invite + pack payload types. */

/** Options for creating an expression pack. */
export interface PackCreateOptions {
  name: string;
  description?: string | null;
}

/** Fields to update on an expression pack. */
export interface PackEditOptions {
  name?: string;
  description?: string | null;
}

/** Options for creating a pack invite. */
export interface PackInviteCreateOptions {
  maxUses?: number;
  maxAge?: number;
  unique?: boolean;
}

/** Convert {@link PackInviteCreateOptions} to the pack invite wire body. */
export function toPackInviteBody(options: PackInviteCreateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.maxUses !== undefined) body.max_uses = options.maxUses;
  if (options.maxAge !== undefined) body.max_age = options.maxAge;
  if (options.unique !== undefined) body.unique = options.unique;
  return body;
}

/** Small emoji payload returned from pack list/create. */
export interface PackEmojiPayload {
  id: string;
  name: string;
  animated?: boolean;
}

/** Small sticker payload from pack list/create. */
export interface PackStickerPayload {
  id: string;
  name: string;
  description: string;
  tags: string[];
  animated: boolean;
  nsfw: boolean;
}

/** Invite metadata payload (camelCase). */
export interface PackInvitePayload {
  code: string;
  maxUses?: number;
  maxAge?: number;
  uses?: number;
  temporary?: boolean;
  unique?: boolean;
  createdAt?: string;
  expiresAt?: string | null;
}

/** Bulk create result (camelCase). */
export interface PackBulkCreatePayload<T> {
  success: T[];
  failed: Array<{ name: string; error: string }>;
}
