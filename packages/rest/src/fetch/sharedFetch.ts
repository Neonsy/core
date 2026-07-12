/**
 * Process-wide keep-alive Agent (undici). Pools TCP only —
 * RateLimitManager still gates every request before fetch.
 */

import { Agent } from 'undici';

let sharedAgent: Agent | null = null;

function getSharedAgent(): Agent {
  sharedAgent ??= new Agent({
    keepAliveTimeout: 30_000,
    keepAliveMaxTimeout: 60_000,
    connections: 32,
    pipelining: 1,
  });
  return sharedAgent;
}

type FetchInit = RequestInit & { dispatcher?: Agent };

export function sharedFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const withDispatcher: FetchInit = { ...init, dispatcher: getSharedAgent() };
  try {
    return fetch(input, withDispatcher as RequestInit);
  } catch (err) {
    if (err instanceof TypeError) return fetch(input, init);
    throw err;
  }
}

export async function closeSharedFetch(): Promise<void> {
  if (!sharedAgent) return;
  const agent = sharedAgent;
  sharedAgent = null;
  await agent.close();
}
