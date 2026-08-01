import type {
  APIChannel,
  APIChannelOverwrite,
  APIInvite,
  APIWebhook,
  OverwriteType,
} from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { PermissionFlags } from '@fluxerjs/util';
import type { Client } from '../../ClientCore/Client.js';
import {
  type ChannelEditOptions,
  type ChannelInviteCreateOptions,
  type SudoVerificationOptions,
  toChannelEditBody,
  toChannelInviteBody,
  toSudoBody,
} from '../../ClientCore/SdkOptions/index.js';
import { Invite } from '../Invite.js';
import { Webhook } from '../Webhook.js';
import { Channel } from './Base.js';
import { TextCapable } from './TextCapable.js';

/** A channel in a guild (text, voice, category, etc.). */
export class GuildChannel extends Channel {
  /** Guild ID this channel belongs to. */
  readonly guildId: string;
  declare name: string | null;
  /** Position in the channel list. */
  position?: number;
  /** Parent category ID, or null if none. */
  parentId: string | null;
  /** Permission overwrites for roles/members. */
  permissionOverwrites: APIChannelOverwrite[];

  constructor(client: Client, data: APIChannel) {
    super(client, data);
    this.guildId = data.guild_id ?? '';
    this.name = data.name ?? null;
    this.position = data.position;
    this.parentId = data.parent_id ?? null;
    this.permissionOverwrites = data.permission_overwrites ?? [];
  }

  /**
   * Apply guild-channel fields in place.
   * @internal
   */
  override _patch(data: APIChannel): void {
    super._patch(data);
    if (data.name !== undefined) this.name = data.name ?? null;
    if (data.position !== undefined) this.position = data.position;
    if (data.parent_id !== undefined) this.parentId = data.parent_id ?? null;
    if (data.permission_overwrites !== undefined) {
      this.permissionOverwrites = data.permission_overwrites ?? [];
    }
    this.applyEditPatch(data);
  }

  /** Create a webhook for this channel. Requires Manage Webhooks. */
  async createWebhook(options: { name: string; avatar?: string | null }): Promise<Webhook> {
    const data = await this.client.rest.post(Routes.channelWebhooks(this.id), {
      body: options,
      auth: true,
    });
    return new Webhook(this.client, data as APIWebhook);
  }

  /** Fetch all webhooks in this channel. Requires Manage Webhooks. */
  async fetchWebhooks(): Promise<Webhook[]> {
    const data = await this.client.rest.get<APIWebhook[]>(Routes.channelWebhooks(this.id));
    return data.map((w) => new Webhook(this.client, w));
  }

  /** Create an invite for this channel. Requires Create Instant Invite. */
  async createInvite(options?: ChannelInviteCreateOptions): Promise<Invite> {
    const body = options ? toChannelInviteBody(options) : {};
    const data = await this.client.rest.post(Routes.channelInvites(this.id), {
      body: Object.keys(body).length ? body : undefined,
      auth: true,
    });
    return new Invite(this.client, data as APIInvite);
  }

  /** Fetch all invites for this channel. Requires Manage Channels. */
  async fetchInvites(): Promise<Invite[]> {
    const data = await this.client.rest.get<APIInvite[]>(Routes.channelInvites(this.id));
    return data.map((i) => new Invite(this.client, i));
  }

  /** Edit or create a permission overwrite. Requires Manage Roles. */
  async editPermission(
    overwriteId: string,
    options: { type: OverwriteType; allow?: string; deny?: string },
  ): Promise<void> {
    await this.client.rest.put(Routes.channelPermission(this.id, overwriteId), {
      body: options,
      auth: true,
    });
    const entry: APIChannelOverwrite = {
      id: overwriteId,
      type: options.type,
      allow: options.allow ?? '0',
      deny: options.deny ?? '0',
    };
    const idx = this.permissionOverwrites.findIndex((o) => o.id === overwriteId);
    if (idx >= 0) this.permissionOverwrites[idx] = entry;
    else this.permissionOverwrites.push(entry);
  }

  /** Delete a permission overwrite. Requires Manage Roles. */
  async deletePermission(overwriteId: string): Promise<void> {
    await this.client.rest.delete(Routes.channelPermission(this.id, overwriteId), { auth: true });
    const idx = this.permissionOverwrites.findIndex((o) => o.id === overwriteId);
    if (idx >= 0) this.permissionOverwrites.splice(idx, 1);
  }

  /** Check if the bot can send messages in this channel (with permissions). */
  override canSendMessage(): boolean {
    const me = this.client.guilds.get(this.guildId)?.members.me;
    if (!me) return false;
    const perms = me.permissionsIn(this);
    return perms.has(PermissionFlags.ViewChannel) && perms.has(PermissionFlags.SendMessages);
  }

  /** Edit this channel's settings. Requires Manage Channels. */
  async edit(options: ChannelEditOptions): Promise<this> {
    const data = await this.client.rest.patch<APIChannel>(Routes.channel(this.id), {
      body: toChannelEditBody(options),
      auth: true,
    });
    this.name = data.name ?? this.name;
    this.parentId = data.parent_id ?? this.parentId;
    this.permissionOverwrites = data.permission_overwrites ?? this.permissionOverwrites;
    this.applyEditPatch(data);
    return this;
  }

  protected applyEditPatch(_data: APIChannel): void {}

  /** Delete this channel. Requires Manage Channels or channel ownership. */
  async delete(
    options?: SudoVerificationOptions & { silent?: boolean; deleteMessages?: boolean },
  ): Promise<void> {
    const params = new URLSearchParams();
    if (options?.silent) params.set('silent', 'true');
    if (options?.deleteMessages) params.set('delete_messages', 'true');
    const qs = params.toString();
    const { silent: _s, deleteMessages: _d, ...sudo } = options ?? {};
    const body = Object.keys(sudo).length ? toSudoBody(sudo) : undefined;
    await this.client.rest.delete(Routes.channel(this.id) + (qs ? `?${qs}` : ''), {
      body,
      auth: true,
    });
    this.client.channels.delete(this.id);
    this.client._clearMessageCache(this.id);
    this.client.guilds.get(this.guildId)?.channels.delete(this.id);
  }
}

/** A text channel in a guild (supports sending messages). */
export class TextChannel extends TextCapable(GuildChannel) {
  /** Channel topic. */
  topic?: string | null;
  /** Whether this channel is marked as NSFW. */
  nsfw?: boolean;
  /** Slowmode rate limit in seconds. */
  rateLimitPerUser?: number;
  /** ID of the last message sent in this channel. */
  lastMessageId?: string | null;

  constructor(client: Client, data: APIChannel) {
    super(client, data);
    this.topic = data.topic ?? null;
    this.nsfw = data.nsfw ?? false;
    this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
    this.lastMessageId = data.last_message_id ?? null;
  }

  protected override applyEditPatch(data: APIChannel): void {
    if ('topic' in data) this.topic = data.topic ?? null;
    if ('nsfw' in data) this.nsfw = data.nsfw ?? false;
    if ('rate_limit_per_user' in data) this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
  }
}

/** A category channel (container for organizing channels). */
export class CategoryChannel extends GuildChannel {}

/** A voice channel in a guild. */
export class VoiceChannel extends GuildChannel {
  /** Voice bitrate. */
  bitrate?: number | null;
  /** Maximum number of users allowed. */
  userLimit?: number | null;
  /** RTC region override for this channel. */
  rtcRegion?: string | null;

  constructor(client: Client, data: APIChannel) {
    super(client, data);
    this.bitrate = data.bitrate ?? null;
    this.userLimit = data.user_limit ?? null;
    this.rtcRegion = data.rtc_region ?? null;
  }

  protected override applyEditPatch(data: APIChannel): void {
    if ('bitrate' in data) this.bitrate = data.bitrate ?? null;
    if ('user_limit' in data) this.userLimit = data.user_limit ?? null;
    if ('rtc_region' in data) this.rtcRegion = data.rtc_region ?? null;
  }
}

/** A link channel (redirects to an external URL). */
export class LinkChannel extends GuildChannel {
  /** External URL this channel links to. */
  url: string | null;

  constructor(client: Client, data: APIChannel) {
    super(client, data);
    this.url = data.url ?? null;
  }
}
