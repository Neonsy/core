import type { ErrorCode } from './ErrorCodes.js';

export interface FluxerErrorOptions {
  /** Machine-readable code from {@link ErrorCodes}. */
  code?: ErrorCode | string;
  cause?: unknown;
}

/**
 * Base error for Fluxer SDK failures.
 * Prefer an {@link ErrorCodes} value so callers can branch on `error.code`.
 */
export class FluxerError extends Error {
  readonly code: string | undefined;

  constructor(message: string, options?: FluxerErrorOptions) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'FluxerError';
    this.code = options?.code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static isFluxerError(error: unknown): error is FluxerError {
    return error instanceof FluxerError;
  }

  override toString(): string {
    return this.code
      ? `${this.name} [${this.code}]: ${this.message}`
      : `${this.name}: ${this.message}`;
  }
}
