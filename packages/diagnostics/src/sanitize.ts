import type { DiagnosticData, DiagnosticValue } from './types.js';

const SENSITIVE_KEY_PARTS = new Set([
  'authorization',
  'cookie',
  'credential',
  'headers',
  'password',
  'secret',
  'session',
  'token',
  'body',
  'content',
  'payload',
  'url',
  'endpoint',
]);
const AUTH_VALUE = /\b(?:Bot|Bearer)\s+[A-Za-z0-9._~+/-]{8,}=*/gi;
const JWT_VALUE = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g;
const WEBHOOK_VALUE = /(\/webhooks\/(?:\d{17,19}|:id)\/)[^/\s]+/gi;
const URL_QUERY = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s?#]+)[?#][^\s]*/gi;
const SNOWFLAKE = /\b\d{17,19}\b/g;

const REDACTED = '[REDACTED]';
const CIRCULAR = '[CIRCULAR]';
const MAX_DEPTH = 8;
const MAX_KEYS = 64;
const MAX_ARRAY_LENGTH = 64;
const MAX_STRING_LENGTH = 2_048;

export interface SanitizedDiagnosticData {
  readonly data: DiagnosticData;
  readonly truncated: boolean;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/);
  return (
    normalized.some((part) => SENSITIVE_KEY_PARTS.has(part) || part === 'header') ||
    (normalized.includes('key') &&
      normalized.some((part) => part === 'api' || part === 'private' || part === 'signing'))
  );
}

export function sanitizeDiagnosticString(value: string): string {
  const bounded =
    value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  return bounded
    .replace(AUTH_VALUE, (match) => `${match.split(/\s/, 1)[0]} ${REDACTED}`)
    .replace(JWT_VALUE, REDACTED)
    .replace(WEBHOOK_VALUE, `$1${REDACTED}`)
    .replace(URL_QUERY, `$1?${REDACTED}`)
    .replace(SNOWFLAKE, ':id');
}

export function sanitizeDiagnosticData(value: unknown): SanitizedDiagnosticData {
  const ancestors = new WeakSet<object>();
  let truncated = false;

  const visit = (current: unknown, depth: number): DiagnosticValue => {
    if (current === null || typeof current === 'boolean') return current;
    if (typeof current === 'string') {
      if (current.length > MAX_STRING_LENGTH) truncated = true;
      return sanitizeDiagnosticString(current);
    }
    if (typeof current === 'number') return Number.isFinite(current) ? current : String(current);
    if (typeof current === 'bigint') return current.toString();
    if (typeof current === 'undefined') return null;
    if (typeof current !== 'object') return sanitizeDiagnosticString(String(current));

    if (depth >= MAX_DEPTH) {
      truncated = true;
      return '[MAX_DEPTH]';
    }
    if (ancestors.has(current)) {
      truncated = true;
      return CIRCULAR;
    }
    ancestors.add(current);
    try {
      if (Array.isArray(current)) {
        if (current.length > MAX_ARRAY_LENGTH) truncated = true;
        return current.slice(0, MAX_ARRAY_LENGTH).map((item) => visit(item, depth + 1));
      }

      const output: Record<string, DiagnosticValue> = {};
      let descriptors: Record<string, PropertyDescriptor>;
      try {
        descriptors = Object.getOwnPropertyDescriptors(current);
      } catch {
        truncated = true;
        return '[UNAVAILABLE]';
      }
      const entries = Object.entries(descriptors).filter(([, descriptor]) => descriptor.enumerable);
      if (entries.length > MAX_KEYS) truncated = true;

      for (const [key, descriptor] of entries.slice(0, MAX_KEYS)) {
        if (!('value' in descriptor)) {
          truncated = true;
          continue;
        }
        output[key] = isSensitiveKey(key) ? REDACTED : visit(descriptor.value, depth + 1);
      }
      return output;
    } finally {
      ancestors.delete(current);
    }
  };

  const visited = visit(value, 0);
  const data =
    typeof visited === 'object' && visited !== null && !Array.isArray(visited)
      ? (visited as DiagnosticData)
      : ({ value: visited } as DiagnosticData);
  return { data, truncated };
}

export function deepFreezeDiagnosticValue<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreezeDiagnosticValue(nested);
  }
  return value;
}
