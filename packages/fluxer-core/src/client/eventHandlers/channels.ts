import type { APIChannel, GatewayChannelPinsUpdateDispatchData } from '@fluxerjs/types';
import { Events } from '../../util/Events.js';
import { Channel } from '../../structures/Channel.js';
import type { ChannelPinsUpdatePayload } from '../eventPayloads.js';
import { cacheChannel } from './helpers.js';
import type { HandlerMap } from './types.js';

export const channelHandlers: HandlerMap = {
  CHANNEL_CREATE(client, d) {
    const ch = Channel.fromOrCreate(client, d as APIChannel);
    if (!ch) return;
    cacheChannel(client, ch);
    client.emit(Events.ChannelCreate, ch);
  },

  CHANNEL_UPDATE(client, d) {
    const data = d as APIChannel;
    const existing = client.channels.get(data.id);
    if (existing && existing.type === data.type) {
      const oldCh = Object.assign(
        Object.create(Object.getPrototypeOf(existing)),
        existing,
      ) as Channel;
      existing._patch(data);
      cacheChannel(client, existing);
      client.emit(Events.ChannelUpdate, oldCh, existing);
      return;
    }
    const newCh = Channel.from(client, data);
    if (!newCh) return;
    cacheChannel(client, newCh);
    client.emit(Events.ChannelUpdate, existing ?? newCh, newCh);
  },

  CHANNEL_DELETE(client, d) {
    const { id } = d as { id: string };
    const channel = client.channels.get(id);
    if (!channel) return;
    if ('guildId' in channel && channel.guildId) {
      client.guilds.get(channel.guildId)?.channels.delete(channel.id);
    }
    client.channels.delete(id);
    client._clearMessageCache(id);
    client.emit(Events.ChannelDelete, channel);
  },

  CHANNEL_PINS_UPDATE(client, d) {
    const data = d as GatewayChannelPinsUpdateDispatchData;
    const payload: ChannelPinsUpdatePayload = {
      channelId: data.channel_id,
      guildId: data.guild_id ?? null,
      lastPinTimestamp: data.last_pin_timestamp ?? null,
    };
    const channel = client.channels.get(data.channel_id);
    if (channel && data.last_pin_timestamp !== undefined) {
      channel.lastPinTimestamp = data.last_pin_timestamp ?? null;
    }
    client.emit(Events.ChannelPinsUpdate, payload);
  },
};
