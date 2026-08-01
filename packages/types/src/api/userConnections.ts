import type { Snowflake } from '../Common/Snowflake.js';

/** External connection on a user profile (Bluesky, custom domain, etc.). */
export interface APIUserConnection {
  id: string;
  type: string;
  name: string;
  verified: boolean;
  visibility_flags: number;
  sort_order: number;
}

/** WebAuthn passkey credential metadata. */
export interface APIWebAuthnCredential {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

/** USER_CONNECTIONS_UPDATE gateway payload. */
export interface APIUserConnectionsUpdate {
  connections: APIUserConnection[];
}

/** Guild member snapshot included with bulk reaction adds. */
export interface GatewayReactionMemberSnapshot {
  user?: { id: Snowflake };
  roles?: Snowflake[];
  nick?: string | null;
  joined_at?: string;
  avatar?: string | null;
  [key: string]: unknown;
}
