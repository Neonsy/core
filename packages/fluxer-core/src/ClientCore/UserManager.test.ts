import { Routes } from '@fluxerjs/types';
import { describe, expect, it, vi } from 'vitest';
import { fixtureMember, fixtureUser } from '../TestKit/Fixtures.js';
import { Client } from './Client.js';

function responseError(statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode });
}

describe('UserManager.fetchWithProfile', () => {
  it('returns null for an optional profile that is not found', async () => {
    const client = new Client();
    const userId = 'u1';
    vi.spyOn(client.rest, 'get').mockImplementation(async (route) => {
      if (route === Routes.user(userId)) return fixtureUser({ id: userId }) as never;
      throw responseError(404);
    });

    const result = await client.users.fetchWithProfile(userId);

    expect(result.globalProfile).toBeNull();
    expect(result.user.id).toBe(userId);
  });

  it('preserves unexpected optional-profile failures', async () => {
    const client = new Client();
    const userId = 'u1';
    const failure = responseError(503);
    vi.spyOn(client.rest, 'get').mockImplementation(async (route) => {
      if (route === Routes.user(userId)) return fixtureUser({ id: userId }) as never;
      throw failure;
    });

    await expect(client.users.fetchWithProfile(userId)).rejects.toBe(failure);
  });

  it('preserves guild fetch failures when member data was returned', async () => {
    const client = new Client();
    const userId = 'u1';
    const guildId = 'g1';
    const failure = responseError(503);
    vi.spyOn(client.rest, 'get').mockImplementation(async (route) => {
      if (route === Routes.user(userId)) return fixtureUser({ id: userId }) as never;
      if (route === Routes.guildMember(guildId, userId)) {
        return fixtureMember({ user: fixtureUser({ id: userId }) }) as never;
      }
      throw responseError(404);
    });
    vi.spyOn(client.guilds, 'fetch').mockRejectedValue(failure);

    await expect(client.users.fetchWithProfile(userId, { guildId })).rejects.toBe(failure);
  });
});
