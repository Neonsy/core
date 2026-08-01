/** Channel edit / invite / RTC / slowmode SDK options. */

import type { OverwriteType } from '@fluxerjs/types';

/** A single permission overwrite (`allow`/`deny` bitfield strings) for a channel edit. */
export interface ChannelPermissionOverwriteOptions {
  id: string;
  type: OverwriteType;
  allow?: string;
  deny?: string;
}

/** Options for {@link GuildChannel.edit}. */
export interface ChannelEditOptions {
  name?: string | null;
  topic?: string | null;
  parentId?: string | null;
  bitrate?: number | null;
  userLimit?: number | null;
  nsfw?: boolean;
  rateLimitPerUser?: number;
  rtcRegion?: string | null;
  permissionOverwrites?: ChannelPermissionOverwriteOptions[];
}

/** Convert {@link ChannelEditOptions} to the channel PATCH wire body. */
export function toChannelEditBody(options: ChannelEditOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.topic !== undefined) body.topic = options.topic;
  if (options.parentId !== undefined) body.parent_id = options.parentId;
  if (options.bitrate !== undefined) body.bitrate = options.bitrate;
  if (options.userLimit !== undefined) body.user_limit = options.userLimit;
  if (options.nsfw !== undefined) body.nsfw = options.nsfw;
  if (options.rateLimitPerUser !== undefined) {
    body.rate_limit_per_user = options.rateLimitPerUser;
  }
  if (options.rtcRegion !== undefined) body.rtc_region = options.rtcRegion;
  if (options.permissionOverwrites !== undefined) {
    body.permission_overwrites = options.permissionOverwrites;
  }
  return body;
}

/** Options for {@link GuildChannel.createInvite}. */
export interface ChannelInviteCreateOptions {
  maxUses?: number;
  maxAge?: number;
  unique?: boolean;
  temporary?: boolean;
}

/** Convert {@link ChannelInviteCreateOptions} to the invite create wire body. */
export function toChannelInviteBody(options: ChannelInviteCreateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.maxUses !== undefined) body.max_uses = options.maxUses;
  if (options.maxAge !== undefined) body.max_age = options.maxAge;
  if (options.unique !== undefined) body.unique = options.unique;
  if (options.temporary !== undefined) body.temporary = options.temporary;
  return body;
}

export interface RtcRegionPayload {
  id: string;
  name: string;
  emoji: string;
}

/** CamelCase slowmode state from {@link Channel.fetchSlowmode}. */
export interface ChannelSlowmodePayload {
  rateLimitPerUser: number;
  retryAfterMs: number;
  nextSendAllowedAt: string | null;
}
