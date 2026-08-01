import {
  type APIChannelPartial,
  type APIGuildPartial,
  type APIInvite,
  type APIPackInviteInfo,
  type APIUser,
  InviteType,
  isGroupDmInvite,
  isGuildInvite,
  isPackInvite,
  Routes,
} from '@fluxerjs/types';

import type { Client } from '../ClientCore/Client.js';
import { inviteUrl } from '../Helpers/Instance.js';
import { ErrorCodes } from '../LibErrors/ErrorCodes.js';
import { FluxerError } from '../LibErrors/FluxerError.js';
import { Base } from './Base.js';
import type { Guild } from './Guild/index.js';
import type { User } from './User.js';

/** Extract invite code from a plain code or invite URL. */
export function parseInviteCode(codeOrUrl: string): string {
  const input = codeOrUrl.trim();
  if (!input) {
    throw new FluxerError('Invite code cannot be empty', { code: ErrorCodes.InvalidInvite });
  }

  const fromUrl = (value: string): string | null => {
    if (!URL.canParse(value)) return null;
    try {
      const { pathname } = new URL(value);
      const parts = pathname.split('/').filter(Boolean);
      if (!parts.length) return null;
      const idx = parts.findIndex((s) => /^(invite|invites)$/i.test(s));
      const code = idx >= 0 ? parts[idx + 1] : parts.at(-1);
      return code ? decodeURIComponent(code).trim() : null;
    } catch {
      return null;
    }
  };

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(input);
  const code =
    (hasScheme ? fromUrl(input) : null) ??
    (!hasScheme && URL.canParse(`https://${input}`) ? fromUrl(`https://${input}`) : null) ??
    decodeURIComponent(input).trim();

  if (!code || /[\s/?#]/.test(code)) {
    throw new FluxerError('Invalid invite code or URL', { code: ErrorCodes.InvalidInvite });
  }
  return code;
}

/**
 * Invite to a guild channel, group DM, or emoji/sticker pack.
 * Discriminate with `type` / `isGuild()` / `isGroupDM()` / `isPack()`.
 */
export class Invite extends Base {
  readonly client: Client;
  readonly code: string;
  readonly type: InviteType;
  readonly guild: APIGuildPartial | null;
  readonly channel: APIChannelPartial | null;
  readonly pack: APIPackInviteInfo | null;
  readonly inviter: User | null;
  readonly memberCount: number | null;
  readonly presenceCount: number | null;
  readonly expiresAt: string | null;
  readonly temporary: boolean | null;
  readonly createdAt: string | null;
  readonly uses: number | null;
  readonly maxUses: number | null;
  readonly maxAge: number | null;

  constructor(client: Client, data: APIInvite) {
    super();
    this.client = client;
    this.code = data.code;
    this.type = data.type;
    this.guild = isGuildInvite(data) ? data.guild : null;
    this.channel = isGuildInvite(data) || isGroupDmInvite(data) ? data.channel : null;
    this.pack = isPackInvite(data) ? data.pack : null;
    this.inviter = data.inviter ? client.getOrCreateUser(data.inviter as APIUser) : null;
    this.memberCount = isPackInvite(data) ? null : (data.member_count ?? null);
    this.presenceCount = isGuildInvite(data) ? (data.presence_count ?? null) : null;
    this.expiresAt = data.expires_at ?? null;
    this.temporary = data.temporary ?? null;
    this.createdAt = data.created_at ?? null;
    this.uses = data.uses ?? null;
    this.maxUses = data.max_uses ?? null;
    this.maxAge = data.max_age ?? null;
  }

  isGuild(): boolean {
    return this.type === InviteType.Guild;
  }

  isGroupDM(): boolean {
    return this.type === InviteType.GroupDM;
  }

  isPack(): boolean {
    return this.type === InviteType.EmojiPack || this.type === InviteType.StickerPack;
  }

  /** Full invite URL (uses this client's instance invite base). */
  get url(): string {
    return inviteUrl(this.client.instance.endpoints.invite, this.code);
  }

  /** Cached guild for guild invites, else null. */
  getGuild(): Guild | null {
    return this.guild?.id ? (this.client.guilds.get(this.guild.id) ?? null) : null;
  }

  /** Fetch invite metadata by code or URL (does not join). */
  static async fetch(client: Client, codeOrUrl: string): Promise<Invite> {
    const data = await client.rest.get(Routes.invite(parseInviteCode(codeOrUrl)));
    return new Invite(client, data as APIInvite);
  }

  /** Delete this invite. Requires Manage Guild or Create Instant Invite. */
  async delete(): Promise<void> {
    await this.client.rest.delete(Routes.invite(this.code), { auth: true });
  }
}
