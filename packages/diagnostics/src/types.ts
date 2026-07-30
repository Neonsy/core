export type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

export type DiagnosticPrimitive = string | number | boolean | null;

export type DiagnosticValue =
  | DiagnosticPrimitive
  | readonly DiagnosticValue[]
  | { readonly [key: string]: DiagnosticValue };

export type DiagnosticData = Readonly<Record<string, DiagnosticValue>>;

export type DiagnosticInputData = Readonly<Record<string, unknown>>;

export interface DiagnosticError {
  readonly name: string;
  readonly message: string;
  readonly code?: string | number;
  readonly statusCode?: number;
  readonly retryable?: boolean;
  readonly stack?: string;
  readonly cause?: DiagnosticError;
}

export interface DiagnosticEvent {
  readonly schemaVersion: 1;
  readonly sequence: number;
  readonly timestamp: string;
  readonly level: DiagnosticLevel;
  readonly component: string;
  readonly code: string;
  readonly summary: string;
  readonly data: DiagnosticData;
  readonly truncated?: true;
}

/**
 * Application-owned event destination.
 *
 * The synchronous portion runs inline with emission. Returned promises are
 * observed for rejection but are not awaited.
 */
export type DiagnosticSink = (event: DiagnosticEvent) => void | Promise<void>;

export interface DiagnosticsOptions {
  /** Whether this controller records events. Defaults to `true`. */
  enabled?: boolean;
  /** Minimum captured severity. Defaults to `debug`. */
  level?: DiagnosticLevel;
  /** Components to capture. Omit to capture every component. */
  components?: readonly string[];
  /** Maximum retained events. Defaults to 250. */
  maxEvents?: number;
  /** Maximum serialized data size per event. Defaults to 16 KiB. */
  maxEventBytes?: number;
  /** Include sanitized error stacks. Defaults to `false`. */
  captureStacks?: boolean;
  /** Optional application-owned event destination. */
  sink?: DiagnosticSink | readonly DiagnosticSink[];
}

export interface DiagnosticSource {
  readonly component: string;
  isEnabled(level: DiagnosticLevel): boolean;
  emit(
    level: DiagnosticLevel,
    code: string,
    summary: string,
    data?: DiagnosticInputData | (() => DiagnosticInputData),
  ): void;
  error(error: unknown): DiagnosticError;
}

export interface DiagnosticsStats {
  readonly captured: number;
  readonly dropped: number;
  readonly truncated: number;
  readonly sinkFailures: number;
}

export interface DiagnosticComponentRegistration {
  /** Published package represented by this component. */
  readonly package?: {
    readonly name: string;
    readonly version: string;
  };
  readonly snapshot?: () => DiagnosticInputData;
}

export interface DiagnosticReportContext {
  readonly packages?: Readonly<Record<string, string>>;
  readonly runtime?: DiagnosticInputData;
  readonly state?: DiagnosticInputData;
}

export interface DiagnosticReport {
  readonly format: 'fluxerjs-diagnostics';
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly packages: Readonly<Record<string, string>>;
  readonly runtime?: DiagnosticData;
  readonly state?: DiagnosticData;
  readonly components: Readonly<Record<string, DiagnosticData>>;
  readonly events: readonly DiagnosticEvent[];
  readonly stats: DiagnosticsStats;
}
