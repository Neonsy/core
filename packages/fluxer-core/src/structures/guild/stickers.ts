import type { APIGuildStickerBulkCreateResponse, APISticker } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import type { GuildSticker } from '../GuildSticker.js';
import { cacheSticker } from './cache.js';
import type { Guild } from './Guild.js';

export async function createSticker(
  guild: Guild,
  options: {
    name: string;
    image: string;
    description?: string | null;
    tags?: string[];
  },
): Promise<GuildSticker> {
  const data = await guild.client.rest.post<APISticker>(Routes.guildStickers(guild.id), {
    body: options,
    auth: true,
  });
  return cacheSticker(guild, data);
}

export async function cloneSticker(guild: Guild, sourceStickerId: string): Promise<GuildSticker> {
  const data = await guild.client.rest.post<APISticker>(Routes.guildStickersClone(guild.id), {
    body: { source_sticker_id: sourceStickerId },
    auth: true,
  });
  return cacheSticker(guild, data);
}

export async function createStickersBulk(
  guild: Guild,
  stickers: Array<{ name: string; image: string; description?: string; tags?: string[] }>,
): Promise<{ success: GuildSticker[]; failed: Array<{ name: string; error: string }> }> {
  const data = await guild.client.rest.post<APIGuildStickerBulkCreateResponse>(
    Routes.guildStickersBulk(guild.id),
    { body: { stickers }, auth: true },
  );
  return { success: data.success.map((s) => cacheSticker(guild, s)), failed: data.failed };
}

export async function fetchStickers(guild: Guild): Promise<GuildSticker[]> {
  const data = await guild.client.rest.get<APISticker[]>(Routes.guildStickers(guild.id));
  return data.map((s) => cacheSticker(guild, s));
}

export async function fetchSticker(guild: Guild, stickerId: string): Promise<GuildSticker> {
  const data = await guild.client.rest.get<APISticker>(Routes.guildSticker(guild.id, stickerId));
  return cacheSticker(guild, data);
}
