import {
  type APIEmoji,
  type APIGuildEmojiBulkCreateResponse,
  type APIGuildStickerBulkCreateResponse,
  type APIInviteMetadata,
  type APIPackDashboard,
  type APIPackSummary,
  type APISticker,
  type PackType,
  Routes,
} from '@fluxerjs/types';
import type { Client } from './Client.js';
import type { PackSummaryPayload } from './EventPayloads.js';
import type {
  ExpressionCreateOptions,
  ExpressionEditOptions,
  PackBulkCreatePayload,
  PackCreateOptions,
  PackEditOptions,
  PackEmojiPayload,
  PackInviteCreateOptions,
  PackInvitePayload,
  PackStickerPayload,
  StickerCreateOptions,
  StickerEditOptions,
} from './SdkOptions/index.js';
import {
  toEmojiCreateBody,
  toEmojiEditBody,
  toPackInviteBody,
  toStickerCreateBody,
  toStickerEditBody,
} from './SdkOptions/index.js';

/** Map a wire pack summary to camelCase. */
export function toPackSummaryPayload(data: APIPackSummary): PackSummaryPayload {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type,
    creatorId: data.creator_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    ...(data.installed_at !== undefined ? { installedAt: data.installed_at } : {}),
  };
}

function toEmojiPayload(data: APIEmoji): PackEmojiPayload {
  return {
    id: data.id,
    name: data.name,
    animated: data.animated,
  };
}

function toStickerPayload(data: APISticker): PackStickerPayload {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    tags: data.tags,
    animated: data.animated,
    nsfw: data.nsfw,
  };
}

function toInvitePayload(data: APIInviteMetadata): PackInvitePayload {
  return {
    code: data.code,
    ...(data.max_uses !== undefined ? { maxUses: data.max_uses } : {}),
    ...(data.max_age !== undefined ? { maxAge: data.max_age } : {}),
    ...(data.uses !== undefined ? { uses: data.uses } : {}),
    ...(data.temporary !== undefined ? { temporary: data.temporary } : {}),
    ...(data.created_at !== undefined ? { createdAt: data.created_at } : {}),
    ...(data.expires_at !== undefined ? { expiresAt: data.expires_at } : {}),
  };
}

/** CamelCase pack dashboard section. */
export interface PackDashboardSectionPayload {
  installedLimit: number;
  createdLimit: number;
  installed: PackSummaryPayload[];
  created: PackSummaryPayload[];
}

/** CamelCase pack dashboard. */
export interface PackDashboardPayload {
  emoji: PackDashboardSectionPayload;
  sticker: PackDashboardSectionPayload;
}

function mapDashboardSection(section: APIPackDashboard['emoji']): PackDashboardSectionPayload {
  return {
    installedLimit: section.installed_limit,
    createdLimit: section.created_limit,
    installed: section.installed.map(toPackSummaryPayload),
    created: section.created.map(toPackSummaryPayload),
  };
}

/** REST wrappers for `/packs/*`. Access via `client.packs`. */
export class PackManager {
  constructor(private readonly client: Client) {}

  /** Fetch the current user's pack dashboard (camelCase summaries). */
  async fetchDashboard(): Promise<PackDashboardPayload> {
    const data = await this.client.rest.get<APIPackDashboard>(Routes.packs());
    return {
      emoji: mapDashboardSection(data.emoji),
      sticker: mapDashboardSection(data.sticker),
    };
  }

  /** Create a pack. */
  async create(packType: PackType, body: PackCreateOptions): Promise<PackSummaryPayload> {
    const data = await this.client.rest.post<APIPackSummary>(Routes.packsByType(packType), {
      body,
    });
    return toPackSummaryPayload(data);
  }

  /** Edit a pack. */
  async edit(packId: string, body: PackEditOptions): Promise<PackSummaryPayload> {
    const data = await this.client.rest.patch<APIPackSummary>(Routes.pack(packId), { body });
    return toPackSummaryPayload(data);
  }

  /** Delete a pack. */
  async delete(packId: string): Promise<void> {
    await this.client.rest.delete(Routes.pack(packId));
  }

  /** Install a pack for the current user. */
  async install(packId: string): Promise<void> {
    await this.client.rest.post(Routes.packInstall(packId));
  }

  /** Uninstall a pack for the current user. */
  async uninstall(packId: string): Promise<void> {
    await this.client.rest.delete(Routes.packInstall(packId));
  }

  /** List invites for a pack. */
  async listInvites(packId: string): Promise<PackInvitePayload[]> {
    const data = await this.client.rest.get<APIInviteMetadata[]>(Routes.packInvites(packId));
    return data.map(toInvitePayload);
  }

  /** Create an invite for a pack. */
  async createInvite(
    packId: string,
    options: PackInviteCreateOptions = {},
  ): Promise<PackInvitePayload> {
    const body = toPackInviteBody(options);
    const data = await this.client.rest.post<APIInviteMetadata>(Routes.packInvites(packId), {
      body: Object.keys(body).length ? body : undefined,
    });
    return toInvitePayload(data);
  }

  /** List emojis in a pack. */
  async listEmojis(packId: string): Promise<PackEmojiPayload[]> {
    const data = await this.client.rest.get<APIEmoji[]>(Routes.packEmojis(packId));
    return data.map(toEmojiPayload);
  }

  /** Create an emoji in a pack. */
  async createEmoji(packId: string, options: ExpressionCreateOptions): Promise<PackEmojiPayload> {
    const data = await this.client.rest.post<APIEmoji>(Routes.packEmojis(packId), {
      body: toEmojiCreateBody(options),
    });
    return toEmojiPayload(data);
  }

  /** Bulk-create emojis in a pack. */
  async createEmojisBulk(
    packId: string,
    emojis: ExpressionCreateOptions[],
  ): Promise<PackBulkCreatePayload<PackEmojiPayload>> {
    const data = await this.client.rest.post<APIGuildEmojiBulkCreateResponse>(
      Routes.packEmojisBulk(packId),
      { body: { emojis: emojis.map(toEmojiCreateBody) } },
    );
    return {
      success: data.success.map(toEmojiPayload),
      failed: data.failed,
    };
  }

  /** Edit an emoji in a pack. */
  async editEmoji(
    packId: string,
    emojiId: string,
    options: ExpressionEditOptions,
  ): Promise<PackEmojiPayload> {
    const data = await this.client.rest.patch<APIEmoji>(Routes.packEmoji(packId, emojiId), {
      body: toEmojiEditBody(options),
    });
    return toEmojiPayload(data);
  }

  /** Delete an emoji from a pack. */
  async deleteEmoji(packId: string, emojiId: string): Promise<void> {
    await this.client.rest.delete(Routes.packEmoji(packId, emojiId));
  }

  /** List stickers in a pack. */
  async listStickers(packId: string): Promise<PackStickerPayload[]> {
    const data = await this.client.rest.get<APISticker[]>(Routes.packStickers(packId));
    return data.map(toStickerPayload);
  }

  /** Create a sticker in a pack. */
  async createSticker(packId: string, options: StickerCreateOptions): Promise<PackStickerPayload> {
    const data = await this.client.rest.post<APISticker>(Routes.packStickers(packId), {
      body: toStickerCreateBody(options),
    });
    return toStickerPayload(data);
  }

  /** Bulk-create stickers in a pack. */
  async createStickersBulk(
    packId: string,
    stickers: StickerCreateOptions[],
  ): Promise<PackBulkCreatePayload<PackStickerPayload>> {
    const data = await this.client.rest.post<APIGuildStickerBulkCreateResponse>(
      Routes.packStickersBulk(packId),
      { body: { stickers: stickers.map(toStickerCreateBody) } },
    );
    return {
      success: data.success.map(toStickerPayload),
      failed: data.failed,
    };
  }

  /** Edit a sticker in a pack. */
  async editSticker(
    packId: string,
    stickerId: string,
    options: StickerEditOptions,
  ): Promise<PackStickerPayload> {
    const data = await this.client.rest.patch<APISticker>(Routes.packSticker(packId, stickerId), {
      body: toStickerEditBody(options),
    });
    return toStickerPayload(data);
  }

  /** Delete a sticker from a pack. */
  async deleteSticker(packId: string, stickerId: string): Promise<void> {
    await this.client.rest.delete(Routes.packSticker(packId, stickerId));
  }
}
