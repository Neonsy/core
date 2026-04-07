import { Client } from '../client/Client.js';
import { Base } from './Base.js';
import { APIInvite, APIGuildPartial, APIChannelPartial, APIUser } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { Guild } from './Guild.js';
import { User } from './User.js';
import { FluxerError } from '../errors/FluxerError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';

/** Represents an invite to a guild or channel. */
export class Invite extends Base {
  readonly client: Client;
  readonly code: string;
  readonly type: number;
  readonly guild: APIGuildPartial;
  readonly channel: APIChannelPartial;
  readonly inviter: User | null;
  readonly memberCount: number | null;
  readonly presenceCount: number | null;
  readonly expiresAt: string | null;
  readonly temporary: boolean | null;
  readonly createdAt: string | null;
  readonly uses: number | null;
  readonly maxUses: number | null;
  readonly maxAge: number | null;

  /**
   * Normalize invite input to a raw code (plain code or URL such as https://fluxer.gg/{code}).
   */
  private static normalizeCode(codeOrUrl: string): string {
    const input = codeOrUrl.trim();
    if (!input) {
      throw new FluxerError('Invite code cannot be empty', { code: ErrorCodes.InvalidInvite });
    }

    const parseInviteCodeFromUrl = (value: string): string | null => {
      if (!URL.canParse(value)) return null;
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        return null;
      }
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return null;

      const inviteSegmentIdx = segments.findIndex((segment) => {
        const lower = segment.toLowerCase();
        return lower === 'invite' || lower === 'invites';
      });

      const code =
        inviteSegmentIdx >= 0 && segments[inviteSegmentIdx + 1]
          ? segments[inviteSegmentIdx + 1]
          : segments[segments.length - 1];

      return decodeURIComponent(code).trim();
    };

    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(input);
    const fromAbsolute = hasScheme ? parseInviteCodeFromUrl(input) : null;
    const fromHostLike =
      !hasScheme && URL.canParse(`https://${input}`)
        ? parseInviteCodeFromUrl(`https://${input}`)
        : null;

    const directCode = decodeURIComponent(input).trim();
    const code = fromAbsolute ?? fromHostLike ?? directCode;

    if (!code || /[\s/?#]/.test(code)) {
      throw new FluxerError('Invalid invite code or URL', { code: ErrorCodes.InvalidInvite });
    }

    return code;
  }

  /** @param data - API invite from GET /invites/{code}, channel/guild invite list, or gateway INVITE_CREATE */
  constructor(client: Client, data: APIInvite) {
    super();
    this.client = client;
    this.code = data.code;
    this.type = data.type;
    this.guild = data.guild;
    this.channel = data.channel;
    this.inviter = data.inviter ? client.getOrCreateUser(data.inviter as APIUser) : null;
    this.memberCount = data.member_count ?? null;
    this.presenceCount = data.presence_count ?? null;
    this.expiresAt = data.expires_at ?? null;
    this.temporary = data.temporary ?? null;
    this.createdAt = data.created_at ?? null;
    this.uses = data.uses ?? null;
    this.maxUses = data.max_uses ?? null;
    this.maxAge = data.max_age ?? null;
  }

  /**
   * Fetch invite metadata by code or URL (does not join the guild).
   */
  static async fetch(client: Client, codeOrUrl: string): Promise<Invite> {
    const code = Invite.normalizeCode(codeOrUrl);
    const data = await client.rest.get(Routes.invite(code));
    return new Invite(client, data as APIInvite);
  }

  /** Full invite URL (https://fluxer.gg/{code} or instance-specific). */
  get url(): string {
    return `https://fluxer.gg/${this.code}`;
  }

  /**
   * Resolve the guild from cache if available.
   * @returns The guild, or null if not cached
   */
  getGuild(): Guild | null {
    return this.guild?.id ? (this.client.guilds.get(this.guild.id) ?? null) : null;
  }

  /**
   * Delete this invite.
   * Requires Manage Guild or Create Instant Invite permission.
   */
  async delete(): Promise<void> {
    await this.client.rest.delete(Routes.invite(this.code), { auth: true });
  }
}
