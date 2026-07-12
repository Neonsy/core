import { SdkSymbol } from '@/components/SdkSymbol';
import { getSymbol, loadApiDocs } from '@/lib/api-docs';
import { notFound } from 'next/navigation';

export function generateStaticParams(): { kind: string; name: string }[] {
  const docs = loadApiDocs();
  return [
    ...docs.classes.map((c) => ({ kind: 'class', name: c.name })),
    ...docs.interfaces.map((i) => ({ kind: 'interface', name: i.name })),
    ...docs.enums.map((e) => ({ kind: 'enum', name: e.name })),
  ];
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
