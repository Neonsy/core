import type { DiagnosticSource } from '@fluxerjs/core';

export type VoiceDiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

export const NOOP_VOICE_DIAGNOSTICS: DiagnosticSource = Object.freeze({
  component: 'voice',
  isEnabled: () => false,
  emit: () => {},
  error: () => ({ name: 'Error', message: 'Voice operation failed' }),
});

export function emitVoiceDiagnostic(
  source: DiagnosticSource,
  level: VoiceDiagnosticLevel,
  code: string,
  summary: string,
  data?: () => Record<string, unknown>,
): void {
  try {
    source.emit(level, code, summary, data);
  } catch {
    // Diagnostics must not affect voice behavior.
  }
}

function safeErrorProperty(error: unknown, key: string): unknown {
  if (typeof error !== 'object' || error === null) return undefined;
  try {
    return Reflect.get(error, key);
  } catch {
    return undefined;
  }
}

function diagnosticStack(source: DiagnosticSource | undefined, error: unknown): string | undefined {
  try {
    const stack = source?.error(error).stack;
    return typeof stack === 'string' ? stack : undefined;
  } catch {
    return undefined;
  }
}

export function voiceErrorMetadata(
  error: unknown,
  source?: DiagnosticSource,
): Record<string, unknown> {
  const rawName = safeErrorProperty(error, 'name');
  const rawCode = safeErrorProperty(error, 'code');
  const stack = diagnosticStack(source, error);
  const name =
    typeof rawName === 'string' && /^[a-z][a-z0-9]*$/i.test(rawName)
      ? rawName.slice(0, 64)
      : 'Error';
  const code =
    typeof rawCode === 'number' ||
    (typeof rawCode === 'string' &&
      rawCode.length <= 128 &&
      /^[a-z0-9_.-]+$/i.test(rawCode))
      ? rawCode
      : undefined;
  return {
    name,
    message: 'Voice operation failed',
    ...(code !== undefined ? { code } : {}),
    ...(stack ? { stack } : {}),
  };
}

export function diagnosticCode(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

/** Retain only bounded scalar metrics from verbose media-pipeline debug data. */
export function diagnosticMetrics(
  data: object | undefined,
): Record<string, number | boolean> {
  if (!data) return {};
  const output: Record<string, number | boolean> = {};
  for (const [key, value] of Object.entries(data).slice(0, 16)) {
    if (typeof value === 'boolean') output[key] = value;
    if (typeof value === 'number' && Number.isFinite(value)) output[key] = value;
  }
  return output;
}
