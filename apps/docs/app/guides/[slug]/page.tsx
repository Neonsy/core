import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { getGuidesSidebarGroups } from '@/components/GuidesNav';
import { CodeTabs, Tip, Warning } from '@/components/mdx';
import { MdxPre } from '@/components/mdx-pre';
import { extractToc, OnPageToc } from '@/components/OnPageToc';
import { PageShell } from '@/components/PageShell';
import { getCategoryLabel } from '@/lib/guide-meta';
import { getAllGuides, getGuideBySlug, getGuideSlugs } from '@/lib/guides';

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

const components = { Tip, Warning, CodeTabs, pre: MdxPre };

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const all = getAllGuides();
  const idx = all.findIndex((g) => g.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const toc = extractToc(guide.content);

  return (
    <PageShell
      sidebarTitle="Guides"
      sidebarGroups={getGuidesSidebarGroups(slug)}
      toc={<OnPageToc headings={toc} />}
    >
      <article className="prose prose-docs max-w-none dark:prose-invert">
        <div className="not-prose mb-10">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/guides/" className="transition-colors hover:text-foreground">
              Guides
            </Link>
            <span className="text-border">/</span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {getCategoryLabel(guide.meta.category)}
            </span>
          </nav>
          <h1 className="font-display text-[clamp(1.9rem,4vw,2.75rem)] font-semibold tracking-tight">
            {guide.meta.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {guide.meta.description}
          </p>
        </div>
        <MDXRemote
          source={guide.content}
          components={components}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                rehypeSlug,
                [
                  rehypeAutolinkHeadings,
                  {
                    behavior: 'wrap',
                    properties: { className: ['anchor-link'] },
                  },
                ],
              ],
            },
          }}
        />
      </article>
      <nav className="mt-16 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/guides/${prev.slug}/`}
            className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              ← Previous
            </span>
            <span className="mt-1 text-sm font-semibold transition-colors group-hover:text-primary">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/guides/${next.slug}/`}
            className="group flex flex-col rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/40 sm:col-start-2"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Next →
            </span>
            <span className="mt-1 text-sm font-semibold transition-colors group-hover:text-primary">
              {next.title}
            </span>
          </Link>
        ) : null}
      </nav>
    </PageShell>
  );
}
