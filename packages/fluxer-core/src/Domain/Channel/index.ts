export type { UploadFileForSend } from './Attachments.js';
export { Channel } from './Base.js';
export { DMChannel } from './Dm.js';
export {
  CategoryChannel,
  GuildChannel,
  LinkChannel,
  TextChannel,
  VoiceChannel,
} from './Guild.js';
export type { FetchPinnedMessagesOptions, PinnedMessagesPage } from './TextCapable.js';

import { Channel } from './Base.js';
import { channelFrom, channelFromOrCreate, createDM } from './Factory.js';

// Wire the Channel factory statics here (the channel domain's composition root)
// to avoid a circular import between Base.ts and Factory.ts.
Channel.from = channelFrom;
Channel.fromOrCreate = channelFromOrCreate;
Channel.createDM = createDM;
