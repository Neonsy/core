/** Webhook SDK options. */

/** Fields to update on a webhook (name, avatar, or move channel). */
export interface WebhookEditOptions {
  name?: string;
  avatar?: string | null;
  /** Move webhook to another channel (bot auth only). */
  channelId?: string;
}
