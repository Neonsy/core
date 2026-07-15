import { SdkSymbol } from '@/components/SdkSymbol';
import { getSymbol, loadApiDocs } from '@/lib/api-docs';
import { notFound } from 'next/navigation';

export function generateStaticParams(): { kind: string; name: string }[] {
  const docs = loadApiDocs();
  const params = [
    ...docs.classes.map((c) => ({ kind: 'class', name: c.name })),
    ...docs.interfaces.map((i) => ({ kind: 'interface', name: i.name })),
    ...docs.enums.map((e) => ({ kind: 'enum', name: e.name })),
  ];
  // `output: 'export'` treats an empty list as a missing generateStaticParams().
  if (params.length === 0) {
    throw new Error(
      'No SDK API docs found for /docs/[kind]/[name]. Run `pnpm run generate:docs` before building (public/api is gitignored).',
    );
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string; name: string }>;
}): Promise<{ title: string }> {
  const { name } = await params;
  return { title: name };
}

export default async function SymbolPage({
  params,
}: {
  params: Promise<{ kind: string; name: string }>;
}): Promise<React.ReactElement> {
  const { kind, name } = await params;
  const symbol = getSymbol(kind, name);
  if (!symbol) notFound();

  return <SdkSymbol symbol={symbol} kind={kind} version="latest" basePath="/docs" />;
}
