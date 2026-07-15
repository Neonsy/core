import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Hash,
  Headphones,
  Image,
  MessageSquare,
  Radio,
  Smile,
  Webhook,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { getGuidesSidebarGroups } from '@/components/GuidesNav';
import { PageShell } from '@/components/PageShell';
import { CATEGORY_ORDER, getCategoryLabel } from '@/lib/guide-meta';
import { getGuidesByCategory, guidesBasePath } from '@/lib/guides';
import { loadVersions } from '@/lib/api-docs';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'getting-started': BookOpen,
  'sending-messages': MessageSquare,
  media: Image,
  channels: Hash,
  emojis: Smile,
  webhooks: Webhook,
  voice: Headphones,
  events: Radio,
  other: Wrench,
};

export function GuidesIndexContent({ version }: { version?: string }): React.ReactElement {
  const byCategory = getGuidesByCategory(version);
  const totalGuides = Object.values(byCategory).reduce((n, list) => n + (list?.length ?? 0), 0);
  const firstGuide = byCategory['getting-started']?.[0];
  const base = guidesBasePath(version);
  const label = version ?? loadVersions().latest;

  return (
    <PageShell sidebarTitle="Guides" sidebarGroups={getGuidesSidebarGroups(undefined, version)} wide>
      <header className="mb-14">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-primary/80">
          Fluxer.js v{label} · {totalGuides} guides
        </p>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-semibold tracking-tight">
          Guides
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Practical, copy-pasteable walkthroughs — from your first bot through production patterns
          for messages, media, voice, and events.
        </p>
        {firstGuide ? (
          <Link
            href={`${base}/${firstGuide.slug}/`}
            className="group mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start with {firstGuide.title}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </header>

      <div className="space-y-16">
        {CATEGORY_ORDER.map((cat) => {
          const list = byCategory[cat];
          if (!list?.length) return null;
          const Icon = CATEGORY_ICONS[cat] ?? Wrench;
          return (
            <section key={cat} className="scroll-mt-24" id={cat}>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {getCategoryLabel(cat)}
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground">
                    {list.length} {list.length === 1 ? 'guide' : 'guides'}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((g) => (
                  <Link
                    key={g.slug}
                    href={`${base}/${g.slug}/`}
                    className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                  >
                    <h3 className="flex items-start justify-between gap-3 text-sm font-semibold leading-6 text-foreground">
                      <span className="min-w-0">{g.title}</span>
                      <ArrowUpRight
                        className="mt-0.5 h-4 w-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden
                      />
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{g.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
