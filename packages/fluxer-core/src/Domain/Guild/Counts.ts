/** Count-related fields that may appear on REST / gateway guild payloads. */
export type GuildCountFields = {
  member_count?: number | null;
  online_count?: number | null;
  approximate_member_count?: number | null;
  approximate_presence_count?: number | null;
};

/**
 * Prefer exact `member_count`, else `approximate_member_count` (list `with_counts`).
 * `undefined` means the payload did not include either field (leave cache alone).
 */
export function resolveGuildMemberCount(data: GuildCountFields): number | null | undefined {
  if (data.member_count !== undefined) return data.member_count ?? null;
  if (data.approximate_member_count !== undefined) return data.approximate_member_count ?? null;
  return undefined;
}

/**
 * Prefer exact `online_count`, else `approximate_presence_count` (list `with_counts`).
 * `undefined` means the payload did not include either field (leave cache alone).
 */
export function resolveGuildOnlineCount(data: GuildCountFields): number | null | undefined {
  if (data.online_count !== undefined) return data.online_count ?? null;
  if (data.approximate_presence_count !== undefined) return data.approximate_presence_count ?? null;
  return undefined;
}
