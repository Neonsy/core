import { serializeDiagnosticError } from './errors.js';
import {
  deepFreezeDiagnosticValue,
  sanitizeDiagnosticData,
  sanitizeDiagnosticString,
} from './sanitize.js';
import type {
  DiagnosticComponentRegistration,
  DiagnosticData,
  DiagnosticEvent,
  DiagnosticInputData,
  DiagnosticLevel,
  DiagnosticReport,
  DiagnosticReportContext,
  DiagnosticSink,
  DiagnosticsOptions,
  DiagnosticsStats,
  DiagnosticSource,
} from './types.js';

const DEFAULT_MAX_EVENTS = 250;
const DEFAULT_MAX_EVENT_BYTES = 16 * 1_024;
const MAX_COMPONENT_LENGTH = 64;
const MAX_CODE_LENGTH = 128;
const TEXT_ENCODER = new TextEncoder();
const LEVEL_VALUE: Readonly<Record<DiagnosticLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function validateInteger(
  value: number | undefined,
  fallback: number,
  name: string,
  minimum: number,
): number {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${name} must be a safe integer greater than or equal to ${minimum}`);
  }
  return value;
}

function validateBoolean(value: unknown, fallback: boolean, name: string): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    throw new TypeError(`${name} must be a boolean`);
  }
  return value;
}

function validateLevel(value: unknown): DiagnosticLevel {
  if (value === undefined) return 'debug';
  if (value !== 'debug' && value !== 'info' && value !== 'warn' && value !== 'error') {
    throw new TypeError('level must be one of "debug", "info", "warn" or "error"');
  }
  return value;
}

function validateComponent(component: unknown): string {
  if (typeof component !== 'string') {
    throw new TypeError('Diagnostic component must be a string');
  }
  const normalized = component.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_-]*$/i.test(normalized)) {
    throw new TypeError('Diagnostic component must contain only letters, numbers, "_" or "-"');
  }
  if (normalized.length > MAX_COMPONENT_LENGTH) {
    throw new RangeError(`Diagnostic component must be at most ${MAX_COMPONENT_LENGTH} characters`);
  }
  return normalized;
}

function validateCode(code: string): string {
  const normalized = code.trim();
  if (!/^[a-z][a-z0-9_.-]*$/i.test(normalized)) {
    throw new TypeError('Diagnostic code must contain only letters, numbers, ".", "_" or "-"');
  }
  if (normalized.length > MAX_CODE_LENGTH) {
    throw new RangeError(`Diagnostic code must be at most ${MAX_CODE_LENGTH} characters`);
  }
  return normalized;
}

function addPackageVersion(
  packages: Record<string, string>,
  name: unknown,
  version: unknown,
): void {
  if (
    typeof name !== 'string' ||
    typeof version !== 'string' ||
    !/^(?:@[a-z0-9~][a-z0-9._~-]*\/)?[a-z0-9~][a-z0-9._~-]*$/.test(name)
  ) {
    return;
  }
  packages[name] = sanitizeDiagnosticString(version);
}

function toSinkArray(
  sink: DiagnosticSink | readonly DiagnosticSink[] | undefined,
): DiagnosticSink[] {
  if (sink === undefined) return [];
  const sinks = Array.isArray(sink) ? [...sink] : [sink as DiagnosticSink];
  if (sinks.some((candidate) => typeof candidate !== 'function')) {
    throw new TypeError('sink must be a function or an array of functions');
  }
  return sinks;
}

export class DiagnosticsController {
  readonly enabled: boolean;
  private readonly minimumLevel: DiagnosticLevel;
  private readonly components: ReadonlySet<string> | null;
  private readonly maxEvents: number;
  private readonly maxEventBytes: number;
  private readonly captureStacks: boolean;
  private readonly configuredSinks: readonly DiagnosticSink[];
  private readonly subscribers = new Set<DiagnosticSink>();
  private readonly registrations = new Map<string, DiagnosticComponentRegistration>();
  private readonly events: DiagnosticEvent[] = [];
  private sequence = 0;
  private captured = 0;
  private dropped = 0;
  private truncated = 0;
  private sinkFailures = 0;

  constructor(options: DiagnosticsOptions = {}) {
    this.enabled = validateBoolean(options.enabled, true, 'enabled');
    this.minimumLevel = validateLevel(options.level);
    if (options.components !== undefined && !Array.isArray(options.components)) {
      throw new TypeError('components must be an array of component names');
    }
    this.components = options.components
      ? new Set(options.components.map(validateComponent))
      : null;
    this.maxEvents = validateInteger(options.maxEvents, DEFAULT_MAX_EVENTS, 'maxEvents', 0);
    this.maxEventBytes = validateInteger(
      options.maxEventBytes,
      DEFAULT_MAX_EVENT_BYTES,
      'maxEventBytes',
      1,
    );
    this.captureStacks = validateBoolean(options.captureStacks, true, 'captureStacks');
    this.configuredSinks = toSinkArray(options.sink);
  }

  get size(): number {
    return this.events.length;
  }

  get stats(): DiagnosticsStats {
    return Object.freeze({
      captured: this.captured,
      dropped: this.dropped,
      truncated: this.truncated,
      sinkFailures: this.sinkFailures,
    });
  }

  isEnabled(component: string, level: DiagnosticLevel): boolean {
    return (
      this.enabled &&
      LEVEL_VALUE[level] >= LEVEL_VALUE[this.minimumLevel] &&
      (this.components === null || this.components.has(component))
    );
  }

  createSource(component: string): DiagnosticSource {
    const normalizedComponent = validateComponent(component);
    return Object.freeze({
      component: normalizedComponent,
      isEnabled: (level: DiagnosticLevel) => this.isEnabled(normalizedComponent, level),
      emit: (
        level: DiagnosticLevel,
        code: string,
        summary: string,
        data?: DiagnosticInputData | (() => DiagnosticInputData),
      ) => {
        this.emit(normalizedComponent, level, code, summary, data);
      },
      error: (error: unknown) =>
        serializeDiagnosticError(error, { captureStack: this.captureStacks }),
    });
  }

  subscribe(sink: DiagnosticSink): () => void {
    this.subscribers.add(sink);
    return () => {
      this.subscribers.delete(sink);
    };
  }

  registerComponent(component: string, registration: DiagnosticComponentRegistration): () => void {
    const normalized = validateComponent(component);
    this.registrations.set(normalized, registration);
    return () => {
      if (this.registrations.get(normalized) === registration) {
        this.registrations.delete(normalized);
      }
    };
  }

  snapshot(): readonly DiagnosticEvent[] {
    return Object.freeze([...this.events]);
  }

  clear(): void {
    this.events.length = 0;
    this.sequence = 0;
    this.captured = 0;
    this.dropped = 0;
    this.truncated = 0;
    this.sinkFailures = 0;
  }

  createReport(context: DiagnosticReportContext = {}): DiagnosticReport {
    const components: Record<string, DiagnosticData> = {};
    const packages: Record<string, string> = {};
    for (const [name, version] of Object.entries(context.packages ?? {})) {
      addPackageVersion(packages, name, version);
    }

    for (const [component, registration] of this.registrations) {
      if (registration.package) {
        addPackageVersion(packages, registration.package.name, registration.package.version);
      }
      if (!registration.snapshot) continue;
      try {
        components[component] = sanitizeDiagnosticData(registration.snapshot()).data;
      } catch {
        components[component] = { unavailable: true };
      }
    }

    const runtime = context.runtime
      ? deepFreezeDiagnosticValue(sanitizeDiagnosticData(context.runtime).data)
      : undefined;
    const state = context.state
      ? deepFreezeDiagnosticValue(sanitizeDiagnosticData(context.state).data)
      : undefined;

    return deepFreezeDiagnosticValue({
      format: 'fluxerjs-diagnostics' as const,
      schemaVersion: 1 as const,
      generatedAt: new Date().toISOString(),
      packages,
      ...(runtime ? { runtime } : {}),
      ...(state ? { state } : {}),
      components,
      events: [...this.events],
      stats: this.stats,
    });
  }

  private emit(
    component: string,
    level: DiagnosticLevel,
    code: string,
    summary: string,
    data?: DiagnosticInputData | (() => DiagnosticInputData),
  ): void {
    if (!this.isEnabled(component, level)) return;

    try {
      const normalizedCode = validateCode(code);
      const rawData = typeof data === 'function' ? data() : (data ?? {});
      const sanitized = sanitizeDiagnosticData(rawData);
      let eventData = sanitized.data;
      let wasTruncated = sanitized.truncated;
      const serializedBytes = TEXT_ENCODER.encode(JSON.stringify(eventData)).byteLength;
      if (serializedBytes > this.maxEventBytes) {
        eventData = {
          omitted: 'Diagnostic data exceeded maxEventBytes',
          originalBytes: serializedBytes,
        };
        wasTruncated = true;
      }

      const event = deepFreezeDiagnosticValue({
        schemaVersion: 1 as const,
        sequence: ++this.sequence,
        timestamp: new Date().toISOString(),
        level,
        component,
        code: `${component}.${normalizedCode}`,
        summary: sanitizeDiagnosticString(summary),
        data: eventData,
        ...(wasTruncated ? { truncated: true as const } : {}),
      });

      this.captured++;
      if (wasTruncated) this.truncated++;
      this.events.push(event);
      if (this.events.length > this.maxEvents) {
        this.events.splice(0, this.events.length - this.maxEvents);
        this.dropped++;
      }
      this.deliver(event);
    } catch {
      this.dropped++;
    }
  }

  private deliver(event: DiagnosticEvent): void {
    for (const sink of [...this.configuredSinks, ...this.subscribers]) {
      try {
        const result = sink(event);
        if (result && typeof result.then === 'function') {
          void result.catch(() => {
            this.sinkFailures++;
          });
        }
      } catch {
        this.sinkFailures++;
      }
    }
  }
}
