import type { Snowflake } from '../Common/index.js';
import type { APIGuildMember } from './User.js';

/**
 * Voice state as returned by Fluxer (GUILD_CREATE.voice_states, VOICE_STATE_UPDATE).
 * Matches fluxer `VoiceStateResponse`.
 */
export interface APIVoiceState {
  guild_id?: Snowflake | null;
  channel_id: Snowflake | null;
  user_id: Snowflake;
  connection_id?: string | null;
  session_id?: string;
  member?: APIGuildMember;
  mute: boolean;
  deaf: boolean;
  self_mute: boolean;
  self_deaf: boolean;
  suppress?: boolean;
  self_video?: boolean;
  self_stream?: boolean;
  is_mobile?: boolean;
  viewer_stream_keys?: string[] | null;
  version?: number;
  /** True when the client advertised E2EE support in IDENTIFY. */
  e2ee_capable?: boolean;
}

/** Minimal voice-state stub used by `@fluxerjs/voice` before a full wire payload exists. */
export type APIVoiceStateStub = Partial<APIVoiceState> &
  Pick<APIVoiceState, 'channel_id' | 'user_id'>;
