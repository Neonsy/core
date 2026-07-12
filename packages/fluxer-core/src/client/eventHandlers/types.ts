import type { Client } from '../Client.js';

export type DispatchHandler = (client: Client, data: unknown) => void | Promise<void>;

export type HandlerMap = Record<string, DispatchHandler>;

/** Emit gateway payload as-is under a client event name. */
export function pass(event: string): DispatchHandler {
  return (client, data) => {
    client.emit(event, data);
  };
}

/** Merge handler maps into a dispatch registry. */
export function buildRegistry(...maps: HandlerMap[]): Map<string, DispatchHandler> {
  const registry = new Map<string, DispatchHandler>();
  for (const map of maps) {
    for (const [event, handler] of Object.entries(map)) {
      registry.set(event, handler);
    }
  }
  return registry;
}
