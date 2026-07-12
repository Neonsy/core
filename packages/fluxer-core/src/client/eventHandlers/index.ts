import { buildRegistry, type DispatchHandler } from './types.js';
import { messageHandlers } from './messages.js';
import { guildHandlers } from './guilds.js';
import { channelHandlers } from './channels.js';
import { memberHandlers } from './members.js';
import { inviteHandlers } from './invites.js';
import { guildResourceHandlers } from './guildResources.js';
import { passthroughHandlers } from './passthrough.js';

export type { DispatchHandler };

/** Registry of gateway dispatch event handlers. */
export const eventHandlers = buildRegistry(
  messageHandlers,
  guildHandlers,
  channelHandlers,
  memberHandlers,
  inviteHandlers,
  guildResourceHandlers,
  passthroughHandlers,
);
