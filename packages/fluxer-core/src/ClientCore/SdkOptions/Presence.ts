/** Presence update SDK options. */

/** Options for `client.user.setPresence()` (status, activities, custom status). */
export interface PresenceUpdateOptions {
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  since?: number | null;
  afk?: boolean;
  activities?: Array<{ name: string; type: number; url?: string | null }>;
  customStatus?: {
    text?: string | null;
    emojiName?: string | null;
    emojiId?: string | null;
  } | null;
}

/** Convert presence options to gateway opcode 3 payload. */
export function toPresenceWire(options: PresenceUpdateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = { status: options.status };
  if (options.since !== undefined) body.since = options.since;
  if (options.afk !== undefined) body.afk = options.afk;
  if (options.activities !== undefined) body.activities = options.activities;
  if (options.customStatus !== undefined) {
    body.custom_status =
      options.customStatus === null
        ? null
        : {
            text: options.customStatus.text,
            emoji_name: options.customStatus.emojiName,
            emoji_id: options.customStatus.emojiId,
          };
  }
  return body;
}
