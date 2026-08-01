import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GatewayDispatchEvents } from '@fluxerjs/types';
import { describe, expect, it } from 'vitest';
import { eventHandlers } from '../EventHandlers/index.js';

const HANDLED_ELSEWHERE = new Set(['READY']);

/** Bot-facing dispatches that must be registered in eventHandlers (or READY elsewhere). */
const REQUIRED = [
  'MESSAGE_CREATE',
  'MESSAGE_UPDATE',
  'MESSAGE_DELETE',
  'GUILD_CREATE',
  'GUILD_DELETE',
  'CHANNEL_CREATE',
  'CHANNEL_DELETE',
  'CHANNEL_RECIPIENT_ADD',
  'CHANNEL_RECIPIENT_REMOVE',
  'GUILD_MEMBER_ADD',
  'VOICE_STATE_UPDATE',
] as const;

describe('gateway handler coverage', () => {
  const typed = Object.values(GatewayDispatchEvents);
  const handled = new Set([...eventHandlers.keys(), ...HANDLED_ELSEWHERE]);

  it('registers required bot dispatch handlers', () => {
    for (const name of REQUIRED) {
      expect(handled.has(name), `missing handler for ${name}`).toBe(true);
    }
  });

  it('types cover all registered handler keys', () => {
    for (const key of eventHandlers.keys()) {
      expect(
        typed.includes(key as (typeof typed)[number]),
        `handler ${key} not in GatewayDispatchEvents`,
      ).toBe(true);
    }
  });

  it('writes/reads gateway coverage report when present', () => {
    const reportPath = join(process.cwd(), 'vendor/openapi/gateway-coverage-report.json');
    if (!existsSync(reportPath)) return;
    const report = JSON.parse(readFileSync(reportPath, 'utf8')) as {
      typedCount: number;
      handledCount: number;
      missingRequired: string[];
    };
    expect(report.typedCount).toBeGreaterThan(50);
    expect(report.handledCount).toBeGreaterThan(40);
    expect(report.missingRequired).toEqual([]);
  });
});
