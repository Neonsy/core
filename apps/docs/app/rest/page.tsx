import { Network } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { RestExplorer, type RestExplorerOperation } from '@/components/RestExplorer';
import { getRestSidebarGroups } from '@/components/RestNav';
import { getOperationsByTag, loadOpenApi } from '@/lib/openapi';

export const metadata = { title: 'REST API' };

export default function RestIndexPage(): React.ReactElement {
  const api = loadOpenApi();
  const byTag = getOperationsByTag();
  const tags = Object.keys(byTag).sort();
  const operations: RestExplorerOperation[] = api.operations.map((op) => ({
    operationId: op.operationId,
    method: op.method,
    path: op.path,
    summary: op.summary,
    tag: op.tags[0] ?? 'Other',
    deprecated: op.deprecated,
  }));

  return (
    <PageShell sidebarTitle="REST API" sidebarGroups={getRestSidebarGroups()} wide>
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Network className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="font-mono text-xs uppercase tracking-wider text-primary/80">
            OpenAPI {api.version}
          </p>
        </div>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-semibold tracking-tight">
          {api.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {api.description ?? 'HTTP API reference generated from the OpenAPI specification.'}
        </p>
        {api.servers[0] ? (
          <p className="mt-5 inline-flex break-all rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground">
            {api.servers[0].url}
          </p>
        ) : null}
      </header>

      <RestExplorer operations={operations} tags={tags} />
    </PageShell>
  );
}
