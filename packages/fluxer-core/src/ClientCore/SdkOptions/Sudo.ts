/** Sudo verification SDK options. */

/** Credentials for a sudo (elevated-action) verification: password and/or MFA. */
export interface SudoVerificationOptions {
  password?: string;
  mfaMethod?: 'totp' | 'webauthn';
  mfaCode?: string;
  webauthnResponse?: Record<string, unknown>;
  webauthnChallenge?: string;
}

/** Convert {@link SudoVerificationOptions} to the wire sudo body. */
export function toSudoBody(options: SudoVerificationOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.password !== undefined) body.password = options.password;
  if (options.mfaMethod !== undefined) body.mfa_method = options.mfaMethod;
  if (options.mfaCode !== undefined) body.mfa_code = options.mfaCode;
  if (options.webauthnResponse !== undefined) body.webauthn_response = options.webauthnResponse;
  if (options.webauthnChallenge !== undefined) body.webauthn_challenge = options.webauthnChallenge;
  return body;
}
