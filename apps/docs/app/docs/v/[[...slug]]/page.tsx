import { notFound, redirect } from 'next/navigation';
import { SdkIndex } from '@/components/SdkIndex';
import { SdkSymbol } from '@/components/SdkSymbol';
import { getSymbol, loadApiDocsFor, loadVersions } from '@/lib/api-docs';

/**
 * Versioned SDK routes (static export):
 *   /docs/v/                 → redirect to /docs/ (latest)
 *   /docs/v/2.0.0/           → version index
 *   /docs/v/2.0.0/class/Foo/ → versioned symbol
 *
 * Optional catch-all so `generateStaticParams` may return [] when no v2 tags exist
 * (plain `[version]` + nested dynamics fail `output: 'export'` with an empty list).
 */
export function generateStaticParams(): { slug: string[] }[] {
  // Static export requires a non-empty list. Always emit the bare /docs/v/ path
  // (redirects to latest). Tagged versions are added when present.
  const params: { slug: string[] }[] = [{ slug: [] }];
  for (const version of loadVersions().versions) {
    params.push({ slug: [version] });
    const docs = loadApiDocsFor(version);
    for (const c of docs.classes) {
      params.push({ slug: [version, 'class', c.name] });
    }
    for (const i of docs.interfaces) {
      params.push({ slug: [version, 'interface', i.name] });
    }
    for (const e of docs.enums) {
      params.push({ slug: [version, 'enum', e.name] });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<{ title: string }> {
  const slug = (await params).slug ?? [];
  if (slug.length === 0) return { title: 'SDK' };
  if (slug.length === 1) return { title: `SDK · v${slug[0]}` };
  if (slug.length === 3) return { title: `${slug[2]} · v${slug[0]}` };
  return { title: 'SDK' };
}

export default async function VersionedDocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<React.ReactElement> {
  const slug = (await params).slug ?? [];

  if (slug.length === 0) {
    redirect('/docs/');
  }

  const version = slug[0]!;
  const { versions } = loadVersions();
  if (!versions.includes(version)) notFound();

  const basePath = `/docs/v/${version}`;

  if (slug.length === 1) {
    return <SdkIndex docs={loadApiDocsFor(version)} version={version} basePath={basePath} />;
  }

  if (slug.length === 3) {
    const kind = slug[1]!;
    const name = slug[2]!;
    if (kind !== 'class' && kind !== 'interface' && kind !== 'enum') notFound();
    const symbol = getSymbol(kind, name, version);
    if (!symbol) notFound();
    return <SdkSymbol symbol={symbol} kind={kind} version={version} basePath={basePath} />;
  }

  notFound();
}
