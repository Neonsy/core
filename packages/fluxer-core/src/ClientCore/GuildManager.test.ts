import { Routes } from '@fluxerjs/types';
import { describe, expect, it, vi } from 'vitest';
import { fixtureGuild } from '../TestKit/Fixtures.js';
import { Client } from './Client.js';

describe('GuildManager', () => {
  it('hydrates counts from REST on a cache miss', async () => {
    const client = new Client();
    const data = fixtureGuild({ member_count: 120, online_count: 17 });
    const get = vi.spyOn(client.rest, 'get').mockResolvedValue(data);

    const guild = await client.guilds.fetch(data.id);

    expect(get).toHaveBeenCalledWith(Routes.guild(data.id));
    expect(guild).toMatchObject({ memberCount: 120, onlineCount: 17 });
  });

  it('force fetch patches metadata without clearing cached counts when REST omits them', async () => {
    const client = new Client();
    const id = fixtureGuild().id;
    const get = vi.spyOn(client.rest, 'get');
    get.mockResolvedValueOnce(fixtureGuild({ member_count: 120, online_count: 17 }));
    const cached = await client.guilds.fetch(id);

    get.mockResolvedValueOnce(fixtureGuild({ name: 'Updated name' }));
    const guild = await client.guilds.fetch(id, { force: true });

    expect(get).toHaveBeenLastCalledWith(Routes.guild(id));
    expect(guild).toBe(cached);
    expect(guild).toMatchObject({ name: 'Updated name', memberCount: 120, onlineCount: 17 });
  });

  it('force fetch updates counts when REST includes them', async () => {
    const client = new Client();
    const id = fixtureGuild().id;
    const get = vi.spyOn(client.rest, 'get');
    get.mockResolvedValueOnce(fixtureGuild({ member_count: 120, online_count: 17 }));
    await client.guilds.fetch(id);

    get.mockResolvedValueOnce(fixtureGuild({ member_count: 140, online_count: 22 }));
    const guild = await client.guilds.fetch(id, { force: true });

    expect(guild).toMatchObject({ memberCount: 140, onlineCount: 22 });
  });

  it('hydrates counts from approximate_* when exact fields are absent', async () => {
    const client = new Client();
    const data = fixtureGuild({
      approximate_member_count: 80,
      approximate_presence_count: 5,
    });
    vi.spyOn(client.rest, 'get').mockResolvedValue(data);

    const guild = await client.guilds.fetch(data.id);
    expect(guild).toMatchObject({ memberCount: 80, onlineCount: 5 });
  });
});
