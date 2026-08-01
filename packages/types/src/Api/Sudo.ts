/**
 * Sudo / MFA verification body used by sensitive DELETE/POST operations
 * (guild delete, leave with delete_messages, group DM leave, etc.).
 */
export interface APISudoVerification {
  password?: string;
  mfa_method?: 'totp' | 'webauthn';
  mfa_code?: string;
  webauthn_response?: Record<string, unknown>;
  webauthn_challenge?: string;
}
