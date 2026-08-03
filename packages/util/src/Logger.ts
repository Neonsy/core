export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export type LogFields = Record<string, unknown>;

export type LoggerSink = (level: LogLevel, message: string, fields?: LogFields) => void;

export interface LoggerOptions {
  /** Minimum level to emit. Default: `warn`. */
  level?: LogLevel;
  /** Optional sink; defaults to console. */
  sink?: LoggerSink;
}

export interface Logger {
  readonly level: LogLevel;
  error(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  debug(message: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
}

function defaultSink(level: LogLevel, message: string, fields?: LogFields): void {
  const payload = fields && Object.keys(fields).length > 0 ? [message, fields] : [message];
  switch (level) {
    case 'error':
      console.error(...payload);
      break;
    case 'warn':
      console.warn(...payload);
      break;
    case 'info':
      console.info(...payload);
      break;
    default:
      console.debug(...payload);
  }
}

/** Walk `Error.cause` into a plain JSON-safe object. */
export function serializeError(err: unknown, depth = 0): Record<string, unknown> | string {
  if (err === null || err === undefined) return String(err);
  if (typeof err !== 'object') return String(err);
  if (depth > 5) return '[MaxCauseDepth]';

  const e = err as Error & {
    code?: unknown;
    statusCode?: unknown;
    method?: unknown;
    path?: unknown;
    attempts?: unknown;
    kind?: unknown;
    isRetryable?: unknown;
    retryAfter?: unknown;
    global?: unknown;
    errors?: unknown;
    cause?: unknown;
  };
  const out: Record<string, unknown> = {
    name: e.name ?? 'Error',
    message: e.message ?? String(err),
  };
  if (e.code !== undefined) out.code = e.code;
  if (e.statusCode !== undefined) out.statusCode = e.statusCode;
  if (e.method !== undefined) out.method = e.method;
  if (e.path !== undefined) out.path = e.path;
  if (e.attempts !== undefined) out.attempts = e.attempts;
  if (e.kind !== undefined) out.kind = e.kind;
  if (typeof e.isRetryable === 'boolean') out.isRetryable = e.isRetryable;
  if (e.retryAfter !== undefined) out.retryAfter = e.retryAfter;
  if (e.global !== undefined) out.global = e.global;
  if (Array.isArray(e.errors)) {
    out.errors = e.errors.slice(0, 10).map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return String(item).slice(0, 240);
      const value = item as { path?: unknown; message?: unknown; code?: unknown };
      return {
        ...(typeof value.path === 'string' ? { path: value.path.slice(0, 120) } : {}),
        ...(typeof value.message === 'string' ? { message: value.message.slice(0, 240) } : {}),
        ...(typeof value.code === 'string' || typeof value.code === 'number'
          ? { code: value.code }
          : {}),
      };
    });
  }
  if (e.cause !== undefined) out.cause = serializeError(e.cause, depth + 1);
  return out;
}

class FluxerLogger implements Logger {
  readonly level: LogLevel;
  private readonly sink: LoggerSink;
  private readonly baseFields: LogFields;

  constructor(options: LoggerOptions = {}, baseFields: LogFields = {}) {
    this.level = options.level ?? 'warn';
    this.sink = options.sink ?? defaultSink;
    this.baseFields = baseFields;
  }

  private emit(level: LogLevel, message: string, fields?: LogFields): void {
    if (LEVEL_ORDER[level] > LEVEL_ORDER[this.level]) return;
    const merged =
      fields || Object.keys(this.baseFields).length ? { ...this.baseFields, ...fields } : undefined;
    this.sink(level, message, merged);
  }

  error(message: string, fields?: LogFields): void {
    this.emit('error', message, fields);
  }
  warn(message: string, fields?: LogFields): void {
    this.emit('warn', message, fields);
  }
  info(message: string, fields?: LogFields): void {
    this.emit('info', message, fields);
  }
  debug(message: string, fields?: LogFields): void {
    this.emit('debug', message, fields);
  }

  child(fields: LogFields): Logger {
    return new FluxerLogger(
      { level: this.level, sink: this.sink },
      { ...this.baseFields, ...fields },
    );
  }
}

export function createLogger(options?: LoggerOptions): Logger {
  return new FluxerLogger(options);
}
