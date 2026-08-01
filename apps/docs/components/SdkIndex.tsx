import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Boxes, Braces, Hash } from 'lucide-react';
import Link from 'next/link';
import { getApiSidebarGroups } from '@/components/ApiNav';
import { PageShell } from '@/components/PageShell';
import type { DocClass, DocEnum, DocInterface, DocOutput } from '@/lib/doc-schema';

type Kind = 'class' | 'interface' | 'enum';

interface KindStyle {
  label: string;
  icon: LucideIcon;
  iconWrap: string;
  badge: string;
  hoverBorder: string;
  hoverText: string;
  ring: string;
}

const KIND: Record<Kind, KindStyle> = {
  class: {
    label: 'Classes',
    icon: Boxes,
    iconWrap: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    hoverBorder: 'hover:border-sky-500/50',
    hoverText: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
    ring: 'hover:shadow-sky-500/5',
  },
  interface: {
    label: 'Interfaces',
    icon: Braces,
    iconWrap: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    hoverBorder: 'hover:border-violet-500/50',
    hoverText: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    ring: 'hover:shadow-violet-500/5',
  },
  enum: {
    label: 'Enums',
    icon: Hash,
    iconWrap: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-500/50',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    ring: 'hover:shadow-amber-500/5',
  },
};

function symbolMeta(kind: Kind, s: DocClass | DocInterface | DocEnum): string {
  if (kind === 'enum') {
    const n = (s as DocEnum).members?.length ?? 0;
    return `${n} ${n === 1 ? 'member' : 'members'}`;
  }
  const props = (s as DocClass | DocInterface).properties?.length ?? 0;
  const methods = (s as DocClass | DocInterface).methods?.length ?? 0;
  const parts: string[] = [];
  if (props) parts.push(`${props} ${props === 1 ? 'prop' : 'props'}`);
  if (methods) parts.push(`${methods} ${methods === 1 ? 'method' : 'methods'}`);
  return parts.join(' · ') || 'No members';
}

function SymbolCard({
  kind,
  name,
  pkg,
  meta,
  basePath,
}: {
  kind: Kind;
  name: string;
  pkg?: string;
  meta: string;
  basePath: string;
}): React.ReactElement {
  const style = KIND[kind];
  const base = basePath.replace(/\/$/, '');
  return (
    <Link
      href={`${base}/${kind}/${name}/`}
      className={`group flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${style.hoverBorder} ${style.ring}`}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`min-w-0 truncate font-mono text-sm font-semibold text-foreground transition-colors ${style.hoverText}`}>
          {name}
        </span>
        <ArrowUpRight
          className={`h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 ${style.hoverText}`}
          aria-hidden
        />
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${style.badge}`}>
          {meta}
        </span>
        {pkg ? <span className="truncate font-mono">{pkg.replace('@fluxerjs/', '')}</span> : null}
      </div>
    </Link>
  );
}

export function SdkIndex({
  docs,
  version = 'latest',
  basePath = '/docs',
}: {
  docs: DocOutput;
  version?: string;
  basePath?: string;
}): React.ReactElement {
  const sections: { kind: Kind; list: (DocClass | DocInterface | DocEnum)[] }[] = [
    { kind: 'class', list: docs.classes },
    { kind: 'interface', list: docs.interfaces },
    { kind: 'enum', list: docs.enums },
  ];

  return (
    <PageShell
      sidebarTitle="SDK Reference"
      sidebarGroups={getApiSidebarGroups(
        undefined,
        undefined,
        basePath,
        version === 'latest' ? undefined : version,
      )}
      wide>
      <header className="mb-10">
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-semibold tracking-tight">
          SDK reference
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Every public class, interface, and enum across the Fluxer.js packages — generated straight
          from source.
        </p>
      </header>

      <div className="mb-14 grid gap-3 sm:grid-cols-3">
        {sections.map(({ kind, list }) => {
          const style = KIND[kind];
          const Icon = style.icon;
          return (
            <a
              key={kind}
              href={`#${kind}`}
              className={`group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors ${style.hoverBorder}`}>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconWrap}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <div className="text-2xl font-semibold leading-none tracking-tight">
                  {list.length}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{style.label}</div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="space-y-14">
        {sections.map(({ kind, list }) => {
          if (!list.length) return null;
          const style = KIND[kind];
          const Icon = style.icon;
          return (
            <section key={kind} id={kind} className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconWrap}`}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-tight">{style.label}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{list.length} total</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((s) => (
                  <SymbolCard
                    key={s.id}
                    kind={kind}
                    name={s.name}
                    pkg={s.package}
                    meta={symbolMeta(kind, s)}
                    basePath={basePath}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
