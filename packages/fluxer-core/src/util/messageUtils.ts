import {
  APIAllowedMentions,
  APIEmbed,
  APIMessageReference,
  MessageFlags,
} from '@fluxerjs/types';
import { EmbedBuilder } from '@fluxerjs/builders';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { FluxerError } from '../errors/FluxerError.js';

/** Resolved file data (after URL fetch). Used internally by REST layer. */
export interface ResolvedMessageFile {
  name: string;
  data: Blob | ArrayBuffer | Uint8Array | Buffer;
  filename?: string;
}

/** File data for message attachment uploads. Use `data` for buffers or `url` to fetch from a URL. */
export type MessageFileData =
  | {
      name: string;
      data: Blob | ArrayBuffer | Uint8Array | Buffer;
      filename?: string;
    }
  | {
      name: string;
      url: string;
      filename?: string;
    };

const FILE_FETCH_TIMEOUT_MS = 30_000;

/** Resolve files: fetch URLs to buffers, pass through data as-is. */
export async function resolveMessageFiles(
  files: MessageFileData[],
): Promise<ResolvedMessageFile[]> {
  const result: ResolvedMessageFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f) continue;
    const filename = f.filename ?? f.name;
    if ('url' in f && f.url) {
      if (!URL.canParse(f.url)) {
        throw new FluxerError(`Invalid file URL at index ${i}: ${f.url}`, {
          code: ErrorCodes.InvalidFileUrl,
        });
      }
      let res: Response;
      try {
        res = await fetch(f.url, {
          signal: AbortSignal.timeout(FILE_FETCH_TIMEOUT_MS),
        });
      } catch (err) {
        throw new FluxerError(`Failed to fetch file from ${f.url}`, {
          code: ErrorCodes.FileFetchFailed,
          cause: err instanceof Error ? err : undefined,
        });
      }
      if (!res.ok) {
        throw new FluxerError(
          `Failed to fetch file from ${f.url}: ${res.status} ${res.statusText}`,
          {
            code: ErrorCodes.FileFetchFailed,
          },
        );
      }
      const data = await res.arrayBuffer();
      result.push({ name: f.name, data, filename });
    } else if ('data' in f && f.data != null) {
      result.push({ name: f.name, data: f.data, filename });
    } else {
      throw new FluxerError(`File at index ${i} must have either "data" or "url"`, {
        code: ErrorCodes.InvalidAttachment,
      });
    }
  }
  return result;
}

/** Attachment metadata for file uploads (id matches FormData index). */
export interface MessageAttachmentMeta {
  id: number;
  filename: string;
  title?: string | null;
  description?: string | null;
  /** MessageAttachmentFlags: IS_SPOILER (8), CONTAINS_EXPLICIT_MEDIA (16), IS_ANIMATED (32) */
  flags?: number;
}

/** SDK options for allowed mentions (camelCase). Converted to APIAllowedMentions on send. */
export type AllowedMentionsOptions = {
  parse?: APIAllowedMentions['parse'];
  users?: string[];
  roles?: string[];
  /** Whether to @mention and notify the author of the replied-to message. */
  repliedUser?: boolean;
};

/**
 * Common allowed-mentions presets.
 * Use with `message.send()`, `message.reply()`, or `channel.send()`.
 *
 * @example
 * // Reply without pinging the original author (rare in JS SDKs — Fluxer supports this)
 * await message.reply('Got it!', { ping: false });
 * await message.reply({ content: 'Got it!', allowedMentions: AllowedMentions.suppressReplyPing });
 */
export const AllowedMentions = {
  /** Suppress the replied-to user's @mention notification. The reply thread still appears. */
  suppressReplyPing: { repliedUser: false } satisfies AllowedMentionsOptions,
  /** Parse no mentions from content — @user, @role, and @everyone will not notify. */
  none: { parse: [] } satisfies AllowedMentionsOptions,
  /** Parse user, role, and @everyone mentions (typical default when the field is omitted). */
  all: { parse: ['users', 'roles', 'everyone'] } satisfies AllowedMentionsOptions,
} as const;

/** Target message for `replyTo` on send options. */
export type MessageReplyTarget = {
  channelId: string;
  messageId: string;
  guildId?: string | null;
};

/** Convert SDK allowed-mentions options to the API request shape. */
export function toAPIAllowedMentions(options: AllowedMentionsOptions): APIAllowedMentions {
  const result: APIAllowedMentions = {};
  if (options.parse?.length) result.parse = options.parse;
  if (options.users?.length) result.users = options.users;
  if (options.roles?.length) result.roles = options.roles;
  if (options.repliedUser !== undefined) result.replied_user = options.repliedUser;
  return result;
}

/** Apply reply ping suppression to a message body (`ping: false` / `allowedMentions.repliedUser: false`). */
export function applyReplyPingSuppression(body: SendBodyResult): void {
  body.flags = (body.flags ?? 0) | MessageFlags.SuppressNotifications;
  body.allowed_mentions = {
    ...(body.allowed_mentions ?? {}),
    replied_user: false,
  };
}

/** Options for sending a message. Used by Message.send, Channel.send, ChannelManager.send. */
export type MessageSendOptions = {
  content?: string;
  /** EmbedBuilder instances are auto-converted; raw APIEmbed also supported. */
  embeds?: (APIEmbed | EmbedBuilder)[];
  /** File attachments. When present, request uses multipart/form-data. */
  files?: MessageFileData[];
  /** Attachment metadata for files (id = index). Use when files are provided. */
  attachments?: MessageAttachmentMeta[];
  /** Controls which mentions trigger notifications. */
  allowedMentions?: AllowedMentionsOptions;
  /** Reply to a message (shows as a reply thread). Use with `ping: false` to avoid notifying the author. */
  replyTo?: MessageReplyTarget;
  /**
   * Whether to ping the replied-to user when using `replyTo` (default `true`).
   * Set `false` to reply in-thread without an @mention notification — equivalent to
   * `allowedMentions: AllowedMentions.suppressReplyPing`.
   */
  ping?: boolean;
  /** Text-to-speech message. */
  tts?: boolean;
  /** Sticker IDs to include (max 3). */
  stickerIds?: string[];
  /** Client-generated identifier for the message. */
  nonce?: string;
  /** ID of a favorite meme to attach. */
  favoriteMemeId?: string;
  /** Message flags (e.g. MessageFlags.SuppressNotifications). */
  flags?: number;
};

/** API-ready body from MessageSendOptions (serializes EmbedBuilder, includes attachments when files present). */
export interface SendBodyResult {
  content?: string;
  embeds?: APIEmbed[];
  attachments?: Array<{
    id: number;
    filename: string;
    title?: string | null;
    description?: string | null;
    flags?: number;
  }>;
  allowed_mentions?: APIAllowedMentions;
  message_reference?: APIMessageReference;
  sticker_ids?: string[];
  nonce?: string;
  favorite_meme_id?: string;
  tts?: boolean;
  flags?: number;
}

/** REST post payload for POST /channels/{id}/messages. */
export interface MessagePostPayload {
  body: SendBodyResult;
  files?: ResolvedMessageFile[];
}

/** Build API-ready body from send options (excludes reply routing fields). */
export function buildSendBody(options: string | MessageSendOptions): SendBodyResult {
  const body = typeof options === 'string' ? { content: options } : options;
  const result: SendBodyResult = {};
  if (body.content !== undefined) result.content = body.content;
  if (body.embeds?.length) {
    result.embeds = body.embeds.map((e) => (e instanceof EmbedBuilder ? e.toJSON() : e));
  }
  if (body.files?.length && body.attachments) {
    result.attachments = body.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      ...(a.title != null && { title: a.title }),
      ...(a.description != null && { description: a.description }),
      ...(a.flags != null && { flags: a.flags }),
    }));
  } else if (body.files?.length) {
    result.attachments = body.files.map((f, i) => ({
      id: i,
      filename: f.filename ?? f.name,
    }));
  }
  if (body.allowedMentions) result.allowed_mentions = toAPIAllowedMentions(body.allowedMentions);
  if (body.stickerIds?.length) result.sticker_ids = body.stickerIds;
  if (body.nonce !== undefined) result.nonce = body.nonce;
  if (body.favoriteMemeId !== undefined) result.favorite_meme_id = body.favoriteMemeId;
  if (body.tts !== undefined) result.tts = body.tts;
  if (body.flags !== undefined) result.flags = body.flags;
  return result;
}

function toMessageReference(target: MessageReplyTarget): APIMessageReference {
  const ref: APIMessageReference = {
    channel_id: target.channelId,
    message_id: target.messageId,
  };
  if (target.guildId != null && target.guildId !== '') ref.guild_id = target.guildId;
  return ref;
}

/**
 * Build a full message POST payload (body + optional files) from send options.
 * Handles replies, reply ping suppression, embed serialization, and file resolution.
 */
export async function prepareMessagePostPayload(
  options: string | MessageSendOptions,
): Promise<MessagePostPayload> {
  if (typeof options === 'string') {
    if (options.length === 0) throw new RangeError('Cannot send an empty message');
    options = { content: options };
  }

  const { replyTo, ping, files, allowedMentions, ...sendFields } = options;
  const body = buildSendBody({ ...sendFields, files, allowedMentions });

  if (replyTo) {
    body.message_reference = toMessageReference(replyTo);
    const suppressPing =
      ping === false ||
      allowedMentions?.repliedUser === false ||
      body.allowed_mentions?.replied_user === false;
    if (suppressPing) applyReplyPingSuppression(body);
  } else if (allowedMentions?.repliedUser === false) {
    applyReplyPingSuppression(body);
  }

  const resolvedFiles = files?.length ? await resolveMessageFiles(files) : undefined;
  return { body, files: resolvedFiles };
}
