# @fluxerjs/diagnostics

Structured diagnostics primitives shared by the Fluxer SDK packages. The
controller provides filtered event capture, a bounded in-memory history,
sanitization, component snapshots, and immutable JSON-safe reports.

Most bot applications should enable diagnostics through `@fluxerjs/core`:

```ts
import { Client } from '@fluxerjs/core';

const client = new Client({ diagnostics: true });
const report = client.createDiagnosticReport();
```

Standalone package consumers can create a controller directly:

```ts
import { DiagnosticsController } from '@fluxerjs/diagnostics';

const diagnostics = new DiagnosticsController({
  level: 'info',
  maxEvents: 500,
});
const restSource = diagnostics.createSource('rest');
```

Diagnostics are kept in memory unless the application explicitly subscribes
to events. This package performs no filesystem or network I/O. Stack capture
is disabled by default; sanitization remains best-effort, so inspect reports
before sharing them.

See the [diagnostics guide](https://fluxerjs.blstmo.com/guides/diagnostics/)
for core, cluster, standalone package, privacy, and extension examples.
