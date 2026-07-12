export { Channel } from './channel/base.js';
export { GuildChannel } from './channel/guild.js';
export {
  TextChannel,
  CategoryChannel,
  VoiceChannel,
  LinkChannel,
} from './channel/guildChannels.js';
export { DMChannel } from './channel/dm.js';
export type {
  FetchPinnedMessagesOptions,
  PinnedMessagesPage,
} from './channel/textCapable.js';
export type { UploadFileForSend } from './channel/attachments.js';

import { Channel } from './channel/base.js';
import { channelFrom, channelFromOrCreate, createDM } from './channel/factory.js';

Channel.from = channelFrom;
Channel.fromOrCreate = channelFromOrCreate;
Channel.createDM = createDM;
