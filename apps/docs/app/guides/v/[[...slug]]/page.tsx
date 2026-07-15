import { GuideContent } from '@/components/GuideContent';
import { GuidesIndexContent } from '@/components/GuidesIndexContent';
import { loadVersions } from '@/lib/api-docs';
import { getGuideBySlug, getGuideSlugs } from '@/lib/guides';
import { notFound, redirect } from 'next/navigation';

/**
 * Versioned guide routes (static export):
 *   /guides/v/                 → redirect to /guides/ (latest)
 *   /guides/v/2.0.0/           → version index
 *   /guides/v/2.0.0/installation/ → versioned guide
 */
export function generateStaticParams(): { slug: string[] }[] {
  const params: { slug: string[] }[] = [{ slug: [] }];
  for (const version of loadVersions().versions) {
    params.push({ slug: [version] });
    for (const guideSlug of getGuideSlugs(version)) {
      params.push({ slug: [version, guideSlug] });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<{ title: string; description?: string }> {
  const slug = (await params).slug ?? [];
  if (slug.length === 0) return { title: 'Guides' };
  if (slug.length === 1) return { title: `Guides · v${slug[0]}` };
  if (slug.length === 2) {
    const guide = getGuideBySlug(slug[1]!, slug[0]);
    return {
      title: guide ? `${guide.meta.title} · v${slug[0]}` : 'Guide',
      description: guide?.meta.description,
    };
  }
  return { title: 'Guides' };
}

export default async function VersionedGuidesPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<React.ReactElement> {
  const slug = (await params).slug ?? [];

  if (slug.length === 0) {
    redirect('/guides/');
  }

  const version = slug[0]!;
  const { versions } = loadVersions();
  if (!versions.includes(version)) notFound();

  if (slug.length === 1) {
    return <GuidesIndexContent version={version} />;
  }

  if (slug.length === 2) {
    return <GuideContent slug={slug[1]!} version={version} />;
  }

  notFound();
}
