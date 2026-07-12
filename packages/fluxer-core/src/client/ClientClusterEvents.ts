import type { ClientRuntime } from './ClientCluster.js';

/**
 * @beta ClientCluster lifecycle event names.
 * These are supervisor events — bot gateway events stay on each runtime's `client`.
 */
export const ClientClusterEvents = {
  RuntimeAdded: 'runtimeAdded',
  RuntimeReady: 'runtimeReady',
  RuntimeRemoved: 'runtimeRemoved',
  RuntimeError: 'runtimeError',
} as const;

export type ClientClusterEventName = (typeof ClientClusterEvents)[keyof typeof ClientClusterEvents];

/**
 * @beta Typed payloads for {@link ClientCluster} lifecycle events.
 */
export interface ClientClusterEventMap {
  [ClientClusterEvents.RuntimeAdded]: [runtime: ClientRuntime];
  [ClientClusterEvents.RuntimeReady]: [runtime: ClientRuntime];
  [ClientClusterEvents.RuntimeRemoved]: [runtime: ClientRuntime];
  [ClientClusterEvents.RuntimeError]: [runtime: ClientRuntime, error: Error];
}

export type ClientClusterEventListener<K extends keyof ClientClusterEventMap> = (
  ...args: ClientClusterEventMap[K]
) => void;
