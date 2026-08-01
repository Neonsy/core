import type {
  APIChannel,
  APIGuild,
  APIGuildMember,
  APIInstance,
  APIMessage,
  APIRole,
  APIUserPartial,
  GatewayReceivePayload,
} from '@fluxerjs/types';
import { ChannelType } from '@fluxerjs/types';
import { vi } from 'vitest';
import { Client } from '../ClientCore/Client.js';
import { handleGatewayDispatch } from '../ClientCore/GatewayDispatch.js';
import { DEFAULT_INSTANCE_ENDPOINTS } from '../Helpers/Instance.js';
import type { ClientOptions } from '../Helpers/Options.js';

/** Minimal user payload for unit tests. */
export function fixtureUser(overrides: Partial<APIUserPartial> = {}): APIUserPartial {
  return {
    id: '100000000000000001',
    username: 'testuser',
    discriminator: '0',
    global_name: null,
    avatar: null,
    avatar_color: null,
    flags: 0,
    ...overrides,
  };
}

/** Minimal instance discovery document for unit tests. */
export function fixtureInstance(overrides: Partial<APIInstance> = {}): APIInstance {
  const { endpoints, features, ...rest } = overrides;
  return {
    api_code_version: 1,
    endpoints: {
      ...DEFAULT_INSTANCE_ENDPOINTS,
      ...endpoints,
    },
    captcha: {
      provider: 'none',
      hcaptcha_site_key: null,
      turnstile_site_key: null,
    },
    features: {
      voice_enabled: true,
      stripe_enabled: false,
      self_hosted: false,
      presigned_attachment_uploads: false,
      emails_enabled: false,
      ...features,
    },
    gif: {
      provider: 'none',
      display_name: '',
      attribution_required: false,
    },
    sso: {
      enabled: false,
      enforced: false,
      display_name: null,
      redirect_uri: '',
    },
    registration: {
      mode: 'open',
      admin_registration_urls_enabled: false,
    },
    community: {
      single_community: false,
      single_community_guild_id: null,
      direct_messages_disabled: false,
    },
    services: {
      gif_enabled: false,
      youtube_enabled: false,
      bluesky_enabled: false,
    },
    limits: {
      version: 2,
      traitDefinitions: [],
      rules: [],
      defaultsHash: '',
    },
    push: { public_vapid_key: null },
    app_public: {},
    ...rest,
  };
}

/** Minimal flat guild payload accepted by the guild payload normalizers. */
export function fixtureGuild(overrides: Partial<APIGuild> = {}): APIGuild {
  return {
    id: '200000000000000001',
    name: 'Test Guild',
    icon: null,
    banner: null,
    owner_id: '100000000000000001',
    afk_timeout: 300,
    features: [],
    verification_level: 0,
    mfa_level: 0,
    nsfw_level: 0,
    nsfw: false,
    explicit_content_filter: 0,
    default_message_notifications: 0,
    splash_card_alignment: 0,
    system_channel_flags: 0,
    content_warning_level: 0,
    disabled_operations: 0,
    ...overrides,
  };
}

/** Minimal guild text channel. */
export function fixtureTextChannel(overrides: Partial<APIChannel> = {}): APIChannel {
  return {
    id: '300000000000000001',
    type: ChannelType.GuildText,
    guild_id: '200000000000000001',
    name: 'general',
    position: 0,
    permission_overwrites: [],
    ...overrides,
  } as APIChannel;
}

/** Minimal role. */
export function fixtureRole(overrides: Partial<APIRole> = {}): APIRole {
  return {
    id: '400000000000000001',
    name: 'Member',
    color: 0,
    position: 1,
    permissions: '0',
    hoist: false,
    mentionable: false,
    ...overrides,
  };
}

/** Minimal guild member. */
export function fixtureMember(
  overrides: Partial<APIGuildMember> & { user?: APIUserPartial } = {},
): APIGuildMember & { user: APIUserPartial } {
  const { user, ...rest } = overrides;
  return {
    user: fixtureUser(user),
    roles: [],
    joined_at: '2024-01-01T00:00:00.000Z',
    nick: null,
    mute: false,
    deaf: false,
    ...rest,
  };
}

/** Minimal message. */
export function fixtureMessage(overrides: Partial<APIMessage> = {}): APIMessage {
  return {
    id: '500000000000000001',
    channel_id: '300000000000000001',
    author: fixtureUser(),
    content: 'hello',
    timestamp: '2024-01-01T00:00:00.000Z',
    edited_timestamp: null,
    pinned: false,
    type: 0,
    flags: 0,
    mentions: [],
    mention_roles: [],
    mention_everyone: false,
    tts: false,
    ...overrides,
  } as APIMessage;
}

/** Real {@link Client} with gateway handlers enabled for unit tests. */
export function createTestClient(overrides: ClientOptions = {}): Client {
  return new Client({ gatewayDeferHandlers: false, ...overrides });
}

/** Dispatch a gateway event through the same path production uses (no private casts). */
export function dispatchForTest(client: Client, event: string, data: unknown = {}): Promise<void> {
  const payload = {
    op: 0,
    t: event,
    d: data,
    s: undefined,
  } as unknown as GatewayReceivePayload;
  return handleGatewayDispatch(client, payload, client._deferredGatewayDispatches);
}

/**
 * Lightweight Message stub client (not a full {@link Client}).
 * Prefer {@link createTestClient} when managers / guild cache are needed.
 */
export function createMessageStubClient(overrides: Record<string, unknown> = {}): Client {
  return {
    options: {
      defaultReplyPing: true,
      ...overrides,
    },
    rest: {
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      get: vi.fn(),
    },
    channels: { get: () => null, send: vi.fn() },
    guilds: { get: () => null },
    getOrCreateUser: (u: { id: string; username?: string }) => ({
      id: u.id,
      username: u.username ?? 'u',
    }),
    _addMessageToCache: vi.fn(),
  } as unknown as Client;
}
