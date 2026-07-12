import { Collection } from '@fluxerjs/collection';
import type { APIGuildMember } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';

import type { GuildMember } from './GuildMember.js';
import type { Role } from './Role.js';

/** Role ID or Role object. */
export type RoleResolvable = string | Role;

function roleId(roleOrId: RoleResolvable): string {
  return typeof roleOrId === 'string' ? roleOrId : roleOrId.id;
}

/**
 * Manages a guild member's roles (`add` / `remove` / `set` / `cache`).
 * Requires Manage Roles for mutations.
 */
export class GuildMemberRoleManager {
  private ids: string[];

  constructor(
    private readonly member: GuildMember,
    initial: string[] = [],
  ) {
    this.ids = [...initial];
  }

  get roleIds(): readonly string[] {
    return this.ids;
  }

  has(roleOrId: RoleResolvable): boolean {
    return this.ids.includes(roleId(roleOrId));
  }

  /** Live Role objects from `guild.roles` for this member's role IDs. */
  get cache(): Collection<string, Role> {
    const out = new Collection<string, Role>();
    for (const id of this.ids) {
      const role = this.member.guild.roles.get(id);
      if (role) out.set(id, role);
    }
    return out;
  }

  async add(roleOrId: RoleResolvable): Promise<void> {
    const id = roleId(roleOrId);
    if (this.ids.includes(id)) return;
    await this.member.client.rest.put(
      Routes.guildMemberRole(this.member.guild.id, this.member.id, id),
    );
    this.ids.push(id);
  }

  async remove(roleOrId: RoleResolvable): Promise<void> {
    const id = roleId(roleOrId);
    const idx = this.ids.indexOf(id);
    if (idx === -1) return;
    await this.member.client.rest.delete(
      Routes.guildMemberRole(this.member.guild.id, this.member.id, id),
    );
    this.ids.splice(idx, 1);
  }

  async set(roleIds: string[]): Promise<void> {
    const data = await this.member.client.rest.patch<APIGuildMember>(
      Routes.guildMember(this.member.guild.id, this.member.id),
      { body: { roles: roleIds }, auth: true },
    );
    this.ids = data.roles ? [...data.roles] : [];
  }

  /** @internal Sync from API member payload. */
  _patch(roleIds: string[]): void {
    this.ids = [...roleIds];
  }
}
