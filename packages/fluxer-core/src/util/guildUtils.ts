import type { APIGuild, APIRole } from '@fluxerjs/types';

/**
 * Validate and coerce a gateway guild payload to {@link APIGuild}.
 * Requires a string `id`. Other fields are type-checked only when present
 * (GUILD_UPDATE payloads are often partial).
 */
export function normalizeGuildPayload(
  raw: APIGuild | null | undefined | unknown,
): (APIGuild & { roles?: APIRole[] }) | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  if (typeof o.id !== 'string' || o.id.length === 0) return null;
  if ('name' in o && typeof o.name !== 'string') return null;
  if ('owner_id' in o && typeof o.owner_id !== 'string') return null;
  if ('features' in o && !Array.isArray(o.features)) return null;
  if ('afk_timeout' in o && typeof o.afk_timeout !== 'number') return null;

  for (const key of [
    'verification_level',
    'mfa_level',
    'nsfw_level',
    'explicit_content_filter',
    'default_message_notifications',
  ] as const) {
    if (key in o && typeof o[key] !== 'number') return null;
  }

  if ('icon' in o && o.icon !== null && typeof o.icon !== 'string') return null;
  if ('banner' in o && o.banner !== null && typeof o.banner !== 'string') return null;

  return raw as APIGuild & { roles?: APIRole[] };
}
