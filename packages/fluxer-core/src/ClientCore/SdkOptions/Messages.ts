/** Message bulk-fetch SDK options. */

/** A single channel's request within a bulk message fetch. */
export interface BulkFetchMessagesRequest {
  channelId: string;
  limit: number;
  before?: string;
  after?: string;
  around?: string;
}

/** Convert bulk-fetch requests to wire items. */
export function toBulkFetchWire(requests: readonly BulkFetchMessagesRequest[]): Array<{
  channel_id: string;
  limit: number;
  before?: string;
  after?: string;
  around?: string;
}> {
  return requests.map((r) => ({
    channel_id: r.channelId,
    limit: r.limit,
    ...(r.before !== undefined ? { before: r.before } : {}),
    ...(r.after !== undefined ? { after: r.after } : {}),
    ...(r.around !== undefined ? { around: r.around } : {}),
  }));
}
