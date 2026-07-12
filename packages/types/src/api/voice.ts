import type { Snowflake } from '../common/index.js';
import type { APIGuildMember } from './user.js';

/**
 * Voice state as returned by Fluxer (GUILD_CREATE.voice_states, VOICE_STATE_UPDATE, VOICE_STATES_SYNC).
 * Matches fluxer `VoiceStateResponse`. Mute/deaf flags are always present on wire payloads;
 * optional here so client-side connect stubs (frozen `@fluxerjs/voice`) type-check.
 */
export interface APIVoiceState {
  guild_id?: Snowflake | null;
  channel_id: Snowflake | null;
  user_id: Snowflake;
  connection_id?: string | null;
  /** Present when connected; null/empty on client connect stubs. */
  session_id: string | null;
  member?: APIGuildMember;
  mute?: boolean;
  deaf?: boolean;
  self_mute?: boolean;
  self_deaf?: boolean;
  suppress?: boolean;
  self_video?: boolean;
  self_stream?: boolean;
  is_mobile?: boolean;
  viewer_stream_keys?: string[] | null;
  version?: number;
  /** True when the client advertised E2EE support in IDENTIFY. */
  e2ee_capable?: boolean;
}
