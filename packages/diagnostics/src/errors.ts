import { sanitizeDiagnosticString } from './sanitize.js';
import type { DiagnosticError } from './types.js';

const MAX_CAUSE_DEPTH = 4;
const MAX_STACK_LENGTH = 8_192;
const MAX_PROTOTYPE_DEPTH = 8;

function readDataProperty(value: object, key: string): unknown {
  let current: object | null = value;
  for (let depth = 0; current !== null && depth < MAX_PROTOTYPE_DEPTH; depth++) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (descriptor) {
        return 'value' in descriptor ? descriptor.value : undefined;
      }
      current = Object.getPrototypeOf(current);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function readStack(value: object): unknown {
  try {
    return Reflect.get(value, 'stack');
  } catch {
    return undefined;
  }
}

function scalarCode(value: unknown): string | number | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function safeString(value: unknown): string {
  try {
    return String(value);
  } catch {
    return 'Unknown error';
  }
}

export function serializeDiagnosticError(
  error: unknown,
  options: { captureStack?: boolean } = {},
): DiagnosticError {
  const seen = new WeakSet<object>();

  const visit = (current: unknown, depth: number): DiagnosticError => {
    if (typeof current !== 'object' || current === null) {
      return {
        name: 'Error',
        message: sanitizeDiagnosticString(safeString(current)),
      };
    }
    if (seen.has(current) || depth >= MAX_CAUSE_DEPTH) {
      return {
        name: 'Error',
        message: depth >= MAX_CAUSE_DEPTH ? 'Cause depth exceeded' : 'Circular error cause',
      };
    }
    seen.add(current);

    const rawName = readDataProperty(current, 'name');
    const rawMessage = readDataProperty(current, 'message');
    const rawStack = options.captureStack === true ? readStack(current) : undefined;
    const code = scalarCode(readDataProperty(current, 'code'));
    const statusCode =
      finiteNumber(readDataProperty(current, 'statusCode')) ??
      finiteNumber(readDataProperty(current, 'status'));
    const retryable = readDataProperty(current, 'isRetryable');
    const cause = readDataProperty(current, 'cause');

    const result: {
      name: string;
      message: string;
      code?: string | number;
      statusCode?: number;
      retryable?: boolean;
      stack?: string;
      cause?: DiagnosticError;
    } = {
      name: sanitizeDiagnosticString(
        typeof rawName === 'string' && rawName.length > 0 ? rawName : 'Error',
      ),
      message: sanitizeDiagnosticString(
        typeof rawMessage === 'string' ? rawMessage : 'Unknown error',
      ),
    };
    if (code !== undefined) {
      result.code = typeof code === 'string' ? sanitizeDiagnosticString(code) : code;
    }
    if (statusCode !== undefined) result.statusCode = statusCode;
    if (typeof retryable === 'boolean') result.retryable = retryable;
    if (options.captureStack !== false && typeof rawStack === 'string') {
      result.stack = sanitizeDiagnosticString(rawStack.slice(0, MAX_STACK_LENGTH));
    }
    if (cause !== undefined) result.cause = visit(cause, depth + 1);
    return result;
  };

  return visit(error, 0);
}
