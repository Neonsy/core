# @fluxerjs/diagnostics

Structured diagnostics primitives shared by the Fluxer SDK packages.

Most bot applications should enable diagnostics through `@fluxerjs/core`.
Standalone package consumers can create a controller directly:

```ts
import { DiagnosticsController } from '@fluxerjs/diagnostics';

const diagnostics = new DiagnosticsController();
const restSource = diagnostics.createSource('rest');
```

Diagnostics are kept in memory unless the application explicitly subscribes
to events. This package performs no filesystem or network I/O.
