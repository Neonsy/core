import { describe, it } from 'vitest';
import type { ClientRuntime } from './ClientCluster.js';
import { ClientCluster } from './ClientCluster.js';
import { ClientClusterEvents } from './ClientClusterEvents.js';

type IsAny<T> = 0 extends 1 & T ? true : false;
type Assert<T extends true> = T;
type IsExactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

describe('ClientCluster event typings (compile-time)', () => {
  it('listener args match ClientClusterEventMap', () => {
    const cluster = new ClientCluster({ suppressBetaWarning: true });

    cluster.on(ClientClusterEvents.RuntimeAdded, (runtime) => {
      type _notAny = Assert<IsAny<typeof runtime> extends false ? true : false>;
      type _exact = Assert<IsExactly<typeof runtime, ClientRuntime>>;
      const _id: string = runtime.id;
    });

    cluster.on(ClientClusterEvents.RuntimeError, (runtime, error) => {
      type _rtNotAny = Assert<IsAny<typeof runtime> extends false ? true : false>;
      type _errNotAny = Assert<IsAny<typeof error> extends false ? true : false>;
      type _errExact = Assert<IsExactly<typeof error, Error>>;
      const _msg: string = error.message;
      const _status = runtime.status;
    });

    cluster.emit(ClientClusterEvents.RuntimeReady, {
      id: 'x',
      client: null as unknown as ClientRuntime['client'],
      status: 'ready',
    });

    // @ts-expect-error RuntimeAdded listeners receive exactly one runtime arg
    cluster.on(ClientClusterEvents.RuntimeAdded, (_rt, _extra) => {});
  });
});
