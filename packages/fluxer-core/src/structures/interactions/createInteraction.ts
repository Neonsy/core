import type { APIApplicationCommandInteraction } from '@fluxerjs/types';
import type { Client } from '../../client/Client.js';
import { BaseInteraction } from './BaseInteraction.js';
import { ChatInputCommandInteraction } from './ChatInputCommandInteraction.js';

export type AnyInteraction = ChatInputCommandInteraction | BaseInteraction;

/**
 * Build the appropriate interaction class for `INTERACTION_CREATE`.
 * Slash commands become {@link ChatInputCommandInteraction}; otherwise {@link BaseInteraction}.
 */
export function createInteraction(
  client: Client,
  data: APIApplicationCommandInteraction,
): AnyInteraction {
  if (data.data?.name != null) {
    return new ChatInputCommandInteraction(client, data);
  }
  return new BaseInteraction(client, data);
}

export function isChatInputCommandInteraction(
  interaction: AnyInteraction,
): interaction is ChatInputCommandInteraction {
  return interaction instanceof ChatInputCommandInteraction;
}
