import type {
  APIChannel,
  APIChannelPartial,
  APIChannelSlowmodeState,
  APIRtcRegion,
  RESTPostAPIChannelAttachmentCompleteResponse,
  RESTPostAPIChannelAttachmentUploadResponse,
} from '@fluxerjs/types';
import { ChannelType, Routes } from '@fluxerjs/types';
import type { Client } from '../../client/Client.js';
import { MessageManager } from '../../client/MessageManager.js';
import {
  toAttachmentUploadCompleteBody,
  toAttachmentUploadPlanBody,
  toAttachmentUploadPlanResponse,
  toSudoBody,
  type AttachmentUploadCompleteItem,
  type AttachmentUploadCompleteResponse,
  type AttachmentUploadPlanItem,
  type AttachmentUploadPlanResponse,
  type ChannelSlowmodePayload,
  type RtcRegionPayload,
  type SudoVerificationOptions,
} from '../../client/sdkOptions.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { FluxerError } from '../../errors/FluxerError.js';
import { Base } from '../Base.js';
import { uploadAttachmentsForSend, type UploadFileForSend } from './attachments.js';
import type { DMChannel } from './dm.js';
import type { GuildChannel, LinkChannel, TextChannel, VoiceChannel } from './guild.js';

/** Base class for all channel types. */
export abstract class Channel extends Base {
  /** The {@link Client} that instantiated this channel. */
  readonly client: Client;
  /** Snowflake ID of this channel. */
  readonly id: string;
  /** Channel type (text, voice, category, etc.). */
  type: ChannelType;
  /** Channel name (null for some channel types). */
  name: string | null;
  /** Channel icon hash (null for most channel types). */
  icon: string | null;
  /** ISO8601 timestamp of the last pinned message update. */
  lastPinTimestamp: string | null;

  constructor(client: Client, data: APIChannelPartial) {
    super();
    this.client = client;
    this.id = data.id;
    this.type = data.type;
    this.name = data.name ?? null;
    this.icon = data.icon ?? null;
    this.lastPinTimestamp = (data as APIChannel).last_pin_timestamp ?? null;
  }

  /**
   * Apply shared channel fields in place (gateway CHANNEL_UPDATE when type is unchanged).
   * @internal
   */
  _patch(data: APIChannelPartial | APIChannel): void {
    if (data.type !== undefined) this.type = data.type as ChannelType;
    if (data.name !== undefined) this.name = data.name ?? null;
    if (data.icon !== undefined) this.icon = data.icon ?? null;
    if ('last_pin_timestamp' in data && data.last_pin_timestamp !== undefined) {
      this.lastPinTimestamp = data.last_pin_timestamp ?? null;
    }
  }

  /** Wired in `structures/Channel.ts` after subclasses load. */
  static from(_c: Client, _d: APIChannel | APIChannelPartial): GuildChannel | TextChannel {
    throw new Error('Channel.from not initialized');
  }
  static fromOrCreate(
    _c: Client,
    _d: APIChannel | APIChannelPartial,
  ): TextChannel | DMChannel | GuildChannel {
    throw new Error('Channel.fromOrCreate not initialized');
  }
  static createDM(_c: Client, _d: APIChannelPartial): DMChannel {
    throw new Error('Channel.createDM not initialized');
  }

  /** Check if this channel supports sending messages (text/DM). */
  isTextBased(): this is TextChannel | DMChannel {
    return 'send' in this;
  }
  /** Check if this is a DM, group DM, or personal notes channel. */
  isDM(): this is DMChannel {
    return (
      this.type === ChannelType.DM ||
      this.type === ChannelType.GroupDM ||
      this.type === ChannelType.DMPersonalNotes
    );
  }
  /** Check if this is a personal notes channel. */
  isPersonalNotes(): boolean {
    return this.type === ChannelType.DMPersonalNotes;
  }
  /** Check if this is a voice channel. */
  isVoice(): this is VoiceChannel {
    return 'bitrate' in this;
  }
  /** Check if this is a link channel. */
  isLink(): this is LinkChannel {
    return 'url' in this;
  }

  /**
   * Delete recent messages or an explicit ID list.
   * - `bulkDelete(5)` — fetch last 5 via {@link MessageManager} then delete (1–100)
   * - `bulkDelete(['id1'])` — single DELETE; 2–100 uses bulk-delete route
   */
  async bulkDelete(countOrIds: number | readonly string[]): Promise<string[]> {
    let ids: string[];
    if (typeof countOrIds === 'number') {
      if (!Number.isInteger(countOrIds) || countOrIds < 1 || countOrIds > 100) {
        throw new FluxerError('bulkDelete count must be between 1 and 100', {
          code: ErrorCodes.InvalidBulkDelete,
        });
      }
      ids = [
        ...(await new MessageManager(this.client, this.id).fetch({ limit: countOrIds })).keys(),
      ];
    } else {
      ids = [...countOrIds];
    }
    if (ids.length === 0) return [];
    if (ids.length === 1) {
      await this.client.rest.delete(Routes.channelMessage(this.id, ids[0]!), { auth: true });
      this.client._removeMessageFromCache(this.id, ids[0]!);
      return ids;
    }
    if (ids.length > 100) {
      throw new FluxerError('bulkDelete requires at most 100 message IDs', {
        code: ErrorCodes.InvalidBulkDelete,
      });
    }
    await this.client.rest.post(Routes.channelBulkDelete(this.id), {
      body: { message_ids: ids },
      auth: true,
    });
    for (const id of ids) this.client._removeMessageFromCache(this.id, id);
    return ids;
  }

  /** Delete all messages sent by the bot in this channel (user account feature). */
  async bulkDeleteMyMessages(options?: SudoVerificationOptions): Promise<void> {
    const body = options ? toSudoBody(options) : undefined;
    await this.client.rest.post(Routes.channelBulkDeleteMine(this.id), {
      body: body && Object.keys(body).length ? body : undefined,
      auth: true,
    });
  }

  /** Mark all pinned messages as read in this channel. */
  async acknowledgePins(): Promise<void> {
    await this.client.rest.post(Routes.channelPinsAck(this.id), { auth: true });
  }

  /** Clear the read state for this channel. */
  async clearReadState(): Promise<void> {
    await this.client.rest.delete(Routes.channelMessagesAck(this.id), { auth: true });
  }

  /** Request upload URLs for attachments before sending a message. */
  async requestAttachmentUploads(
    attachments: AttachmentUploadPlanItem[],
  ): Promise<AttachmentUploadPlanResponse> {
    const data = await this.client.rest.post<RESTPostAPIChannelAttachmentUploadResponse>(
      Routes.channelAttachments(this.id),
      {
        body: toAttachmentUploadPlanBody(attachments),
        auth: true,
      },
    );
    return toAttachmentUploadPlanResponse(data);
  }

  /** Complete the attachment upload flow after uploading to the CDN. */
  async completeAttachmentUploads(
    uploads: AttachmentUploadCompleteItem[],
  ): Promise<AttachmentUploadCompleteResponse> {
    const data = await this.client.rest.post<RESTPostAPIChannelAttachmentCompleteResponse>(
      Routes.channelAttachmentsComplete(this.id),
      {
        body: toAttachmentUploadCompleteBody(uploads),
        auth: true,
      },
    );
    return {
      uploads: data.uploads.map((u) => ({ uploadFilename: u.upload_filename })),
    };
  }

  /** Upload files for sending in a message (helper). */
  async uploadAttachmentsForSend(files: UploadFileForSend[]) {
    return uploadAttachmentsForSend(this.client, this.id, files);
  }

  /** Trigger the typing indicator in this channel. */
  async sendTyping(): Promise<void> {
    await this.client.rest.post(Routes.channelTyping(this.id), { auth: true });
  }

  /** Fetch available RTC regions for voice channels. */
  async fetchRtcRegions(): Promise<RtcRegionPayload[]> {
    const data = await this.client.rest.get<APIRtcRegion[]>(Routes.channelRtcRegions(this.id), {
      auth: true,
    });
    return data.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji }));
  }

  /** Fetch slowmode state for this channel. */
  async fetchSlowmode(): Promise<ChannelSlowmodePayload> {
    const data = await this.client.rest.get<APIChannelSlowmodeState>(
      Routes.channelSlowmode(this.id),
      { auth: true },
    );
    return {
      rateLimitPerUser: data.rate_limit_per_user,
      retryAfterMs: data.retry_after_ms,
      nextSendAllowedAt: data.next_send_allowed_at,
    };
  }

  /** Check if the bot can send messages in this channel. */
  canSendMessage(): boolean {
    return this.isDM();
  }
}
