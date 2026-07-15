import { GuideContent } from '@/components/GuideContent';
import { getGuideBySlug, getGuideSlugs } from '@/lib/guides';

export function generateStaticParams(): { slug: string }[] {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<{ title: string; description: string }> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  return {
    title: guide?.meta.title ?? 'Guide',
    description: guide?.meta.description ?? '',
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  return <GuideContent slug={slug} />;
}
