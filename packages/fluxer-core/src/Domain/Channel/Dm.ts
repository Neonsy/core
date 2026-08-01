import type { APIChannel, APIChannelPartial, APIUser } from '@fluxerjs/types';
import { ChannelType, Routes } from '@fluxerjs/types';
import type { Client } from '../../ClientCore/Client.js';
import { ErrorCodes } from '../../LibErrors/ErrorCodes.js';
import { FluxerError } from '../../LibErrors/FluxerError.js';
import type { User } from '../User.js';
import { Channel } from './Base.js';
import { TextCapable } from './TextCapable.js';

/** DM / Group DM / personal notes channel. */
export class DMChannel extends TextCapable(Channel) {
  /** ID of the last message sent in this channel. */
  lastMessageId?: string | null;
  /** Owner ID for group DMs. */
  ownerId: string | null;
  /** Recipients in this DM (includes the bot). */
  recipients: User[];
  /** Custom nicknames for users in a group DM. */
  nicks: Record<string, string>;

  constructor(client: Client, data: APIChannelPartial | APIChannel) {
    super(client, data);
    const full = data as APIChannel;
    this.lastMessageId = full.last_message_id ?? null;
    this.ownerId = full.owner_id ?? null;
    this.recipients = (full.recipients ?? []).map((u: APIUser) => client.getOrCreateUser(u));
    this.nicks = full.nicks ?? {};
  }

  /** Purge all messages from personal notes. Only works on personal notes channels. */
  async purgeMessages(): Promise<number> {
    if (this.type !== ChannelType.DMPersonalNotes) {
      throw new FluxerError('purgeMessages is only available on personal notes channels', {
        code: ErrorCodes.InvalidChannelType,
      });
    }
    const data = await this.client.rest.post<{ deleted_count: number }>(
      Routes.channelMessagesPurge(this.id),
      { auth: true },
    );
    return data.deleted_count;
  }

  /** Pin this DM channel to the top of the DM list. */
  async pinInList(): Promise<void> {
    await this.client.rest.put(Routes.userMeChannelPin(this.id), { auth: true });
  }

  /** Unpin this DM channel from the DM list. */
  async unpinFromList(): Promise<void> {
    await this.client.rest.delete(Routes.userMeChannelPin(this.id), { auth: true });
  }

  /** Add a user to this group DM. */
  async addRecipient(userId: string): Promise<void> {
    await this.client.rest.put(Routes.channelRecipient(this.id, userId), { auth: true });
    const user = this.client.users.get(userId) ?? (await this.client.users.fetch(userId));
    if (user) this.recipients.push(user);
  }

  /** Remove a user from this group DM. */
  async removeRecipient(userId: string, options?: { silent?: boolean }): Promise<void> {
    const url = Routes.channelRecipient(this.id, userId) + (options?.silent ? '?silent=true' : '');
    await this.client.rest.delete(url, { auth: true });
    const idx = this.recipients.findIndex((u) => u.id === userId);
    if (idx >= 0) this.recipients.splice(idx, 1);
  }
}
