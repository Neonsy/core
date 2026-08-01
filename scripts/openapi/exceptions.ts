/**
 * Non-OpenAPI exception registry — gateway payloads & undocumented routes.
 * Every exception needs evidence + owner.
 */
export const NON_OPENAPI_EXCEPTIONS = [
  {
    id: 'gateway-payloads',
    path: 'packages/types/src/Gateway/',
    reason: 'Gateway dispatch shapes are not in REST OpenAPI',
    owner: 'sdk',
    evidence: 'Gateway is WebSocket; OpenAPI covers HTTP only',
  },
  {
    id: 'gateway-user-scoped-dispatches',
    path: 'packages/fluxer-core/src/ClientCore/EventHandlers/',
    reason:
      'User/session dispatches (RELATIONSHIP_*, USER_SETTINGS_*, SAVED_MESSAGE_*, etc.) are typed but intentionally unhandled for bot clients',
    owner: 'sdk',
    evidence: 'See vendor/openapi/gateway-coverage-report.json unhandled list',
  },
  {
    id: 'gateway-call-dispatches',
    path: 'packages/types/src/Gateway/payloads.ts',
    reason:
      'CALL_* events are session/user voice-call scoped; REST call routes are sessionToken-only',
    owner: 'sdk',
    evidence: 'Fluxer OpenAPI /channels/{id}/call* requires sessionToken',
  },
] as const;
