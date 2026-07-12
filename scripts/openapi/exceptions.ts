/**
 * Non-OpenAPI exception registry — gateway payloads & undocumented routes.
 * Every exception needs evidence + owner.
 */
export const NON_OPENAPI_EXCEPTIONS = [
  {
    id: 'gateway-payloads',
    path: 'packages/types/src/gateway/',
    reason: 'Gateway dispatch shapes are not in REST OpenAPI',
    owner: 'sdk',
    evidence: 'Gateway is WebSocket; OpenAPI covers HTTP only',
  },
] as const;
