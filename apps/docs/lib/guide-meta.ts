/**
 * Guide slugs (from content/guides/*.mdx frontmatter):
 * getting-started: installation, basic-bot, errors, caching, multi-instance, migration
 * sending-messages: direct-messages, sending-without-reply, embeds, editing-embeds, embed-media, reactions
 * media: gifs, attachments, attachments-by-url, profile-urls
 * channels / emojis / webhooks / voice / events / other: see CATEGORY_ORDER
 */

const CATEGORY_LABELS: Record<string, string> = {
  'getting-started': 'Getting Started',
  'sending-messages': 'Sending Messages',
  media: 'Media',
  channels: 'Channels',
  emojis: 'Emojis',
  webhooks: 'Webhooks',
  voice: 'Voice',
  events: 'Events',
  other: 'Other',
};

/** Category order for guides index (Getting Started first, etc). */
export const CATEGORY_ORDER: string[] = [
  "getting-started",
  "sending-messages",
  "media",
  "channels",
  "emojis",
  "webhooks",
  "voice",
  "events",
  "other"
];

export function getCategoryLabel(cat?: string): string {
  return (cat && CATEGORY_LABELS[cat]) ?? 'Guides';
}
