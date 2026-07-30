import { DiagnosticsController } from '@fluxerjs/core';
import { describe, expect, it } from 'vitest';
import { diagnosticMetrics, voiceErrorMetadata } from './diagnostics.js';

describe('voice diagnostics', () => {
  it('does not expose error messages or stacks', () => {
    const error = Object.assign(
      new Error('request failed for wss://voice.example/?token=private'),
      { code: 'VOICE_CONNECT_FAILED' },
    );

    const metadata = voiceErrorMetadata(error);

    expect(metadata).toEqual({
      name: 'Error',
      message: 'Voice operation failed',
      code: 'VOICE_CONNECT_FAILED',
    });
    expect(JSON.stringify(metadata)).not.toContain('private');
  });

  it('keeps numeric media metrics and discards text', () => {
    expect(
      diagnosticMetrics({
        bufferedFrames: 4,
        active: true,
        stderr: 'private media path',
        error: 'private error',
      }),
    ).toEqual({
      bufferedFrames: 4,
      active: true,
    });
  });

  it('includes sanitized stacks only when explicitly enabled', () => {
    const source = new DiagnosticsController({ captureStacks: true }).createSource('voice');

    const metadata = voiceErrorMetadata(new Error('Bearer private-stack-token'), source);

    expect(metadata).toMatchObject({
      message: 'Voice operation failed',
      stack: expect.stringContaining('Bearer [REDACTED]'),
    });
    expect(JSON.stringify(metadata)).not.toContain('private-stack-token');
  });
});
