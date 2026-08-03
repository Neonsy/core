import { ErrorCodes, FluxerError } from '@fluxerjs/util';
import { GatewayCloseCodes } from './Utils/Constants.js';

const CLOSE_CODE_NAMES = new Map<number, string>(
  Object.entries(GatewayCloseCodes).map(([name, code]) => [code, name]),
);

/** A gateway shard closed with a code that the client cannot recover from. */
export class GatewayCloseError extends FluxerError {
  readonly shardId: number;
  readonly closeCode: number;
  readonly reason: string | null;
  readonly isRetryable = false;

  constructor(shardId: number, closeCode: number, reason: string | null = null) {
    const codeName = CLOSE_CODE_NAMES.get(closeCode);
    const closeLabel = codeName ? `${closeCode} (${codeName})` : String(closeCode);
    const detail = reason ? `: ${reason}` : '';
    super(`Gateway shard ${shardId} closed with ${closeLabel} and will not reconnect${detail}`, {
      code: ErrorCodes.GatewayFatalClose,
    });
    this.name = 'GatewayCloseError';
    this.shardId = shardId;
    this.closeCode = closeCode;
    this.reason = reason;
    Object.setPrototypeOf(this, GatewayCloseError.prototype);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      shardId: this.shardId,
      closeCode: this.closeCode,
      reason: this.reason,
      isRetryable: this.isRetryable,
    };
  }
}
