import { Boxes, Braces, ExternalLink, Hash, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { getApiSidebarGroups } from '@/components/ApiNav';
import { PageShell } from '@/components/PageShell';
import { DocDescription, TypeText } from '@/components/TypeText';
import { docsGitRef, githubSourceUrl } from '@/lib/api-docs';
import type { DocClass, DocEnum, DocInterface, DocParam, DocSymbol } from '@/lib/doc-schema';
import { cn } from '@/lib/utils';

interface KindStyle {
  label: string;
  icon: LucideIcon;
  badge: string;
  accentText: string;
  accentBar: string;
  memberHover: string;
  chip: string;
}

const KIND_STYLE: Record<string, KindStyle> = {
  class: {
    label: 'Class',
    icon: Boxes,
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    accentText: 'text-sky-600 dark:text-sky-400',
    accentBar: 'bg-sky-500',
    memberHover: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
    chip: 'hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400',
  },
  interface: {
    label: 'Interface',
    icon: Braces,
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    accentText: 'text-violet-600 dark:text-violet-400',
    accentBar: 'bg-violet-500',
    memberHover: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    chip: 'hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400',
  },
  enum: {
    label: 'Enum',
    icon: Hash,
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBar: 'bg-amber-500',
    memberHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    chip: 'hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400',
  },
};

const FALLBACK_STYLE: KindStyle = {
  label: 'Symbol',
  icon: Hash,
  badge: 'bg-muted text-foreground',
  accentText: 'text-primary',
  accentBar: 'bg-primary',
  memberHover: 'group-hover:text-primary',
  chip: 'hover:border-primary/50 hover:text-primary',
};

export function SdkSymbol({
  symbol,
  kind,
  version = 'latest',
  basePath = '/docs',
}: {
  symbol: DocSymbol;
  kind: string;
  version?: string;
  basePath?: string;
}): React.ReactElement {
  const base = basePath.replace(/\/$/, '');
  const source = githubSourceUrl(symbol.source, docsGitRef(version));
  const style = KIND_STYLE[kind] ?? FALLBACK_STYLE;
  const Icon = style.icon;
  const jumpLinks = buildJumpLinks(symbol);
  const versionForNav = version === 'latest' ? undefined : version;

  return (
    <PageShell
      sidebarTitle="SDK Reference"
      sidebarGroups={getApiSidebarGroups(kind, symbol.name, basePath, versionForNav)}
      wide>
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`${base}/`} className="transition-colors hover:text-foreground">
          SDK
        </Link>
        <span className="text-border">/</span>
        <Link
          href={`${base}/#${kind}`}
          className="capitalize transition-colors hover:text-foreground">
          {style.label}
        </Link>
        {symbol.package ? (
          <>
            <span className="text-border">/</span>
            <span className="font-mono text-xs">{symbol.package.replace('@fluxerjs/', '')}</span>
          </>
        ) : null}
      </nav>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            style.badge,
          )}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <span
            className={cn(
              'font-mono text-[11px] font-semibold uppercase tracking-wide',
              style.accentText,
            )}>
            {style.label}
          </span>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {symbol.name}
          </h1>
        </div>
      </div>

      {symbol.description ? (
        <DocDescription
          text={symbol.description}
          className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
        />
      ) : null}

      {symbol.kind === 'interface' && symbol.extends?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Extends{' '}
          {symbol.extends.map((ext, i) => (
            <span key={ext}>
              {i > 0 ? ', ' : null}
              <TypeText type={ext} className="font-mono text-[13px]" />
            </span>
          ))}
        </p>
      ) : null}
      {symbol.kind === 'class' && symbol.extends ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Extends <TypeText type={symbol.extends} className="font-mono text-[13px]" />
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {jumpLinks.map((j) => (
          <a
            key={j.id}
            href={`#${j.id}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors',
              style.chip,
            )}>
            {j.label}
            <span className="font-mono text-[10px] text-muted-foreground/70">{j.count}</span>
          </a>
        ))}
        {source ? (
          <a
            href={source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
            <ExternalLink className="h-3 w-3" aria-hidden />
            Source
          </a>
        ) : null}
      </div>

      {symbol.kind === 'class' ? <ClassBody symbol={symbol} style={style} /> : null}
      {symbol.kind === 'interface' ? <InterfaceBody symbol={symbol} style={style} /> : null}
      {symbol.kind === 'enum' ? <EnumBody symbol={symbol} style={style} /> : null}
    </PageShell>
  );
}

function buildJumpLinks(
  symbol: DocClass | DocInterface | DocEnum,
): { id: string; label: string; count: number }[] {
  const links: { id: string; label: string; count: number }[] = [];
  if (symbol.kind === 'class') {
    if (symbol.constructor) links.push({ id: 'constructor', label: 'Constructor', count: 1 });
    if (symbol.properties?.length)
      links.push({ id: 'properties', label: 'Properties', count: symbol.properties.length });
    if (symbol.methods?.length)
      links.push({ id: 'methods', label: 'Methods', count: symbol.methods.length });
  } else if (symbol.kind === 'interface') {
    if (symbol.unionMembers?.length)
      links.push({ id: 'members', label: 'Members', count: symbol.unionMembers.length });
    if (symbol.properties?.length)
      links.push({ id: 'properties', label: 'Properties', count: symbol.properties.length });
    if (symbol.methods?.length)
      links.push({ id: 'methods', label: 'Methods', count: symbol.methods.length });
  } else if (symbol.kind === 'enum') {
    if (symbol.members?.length)
      links.push({ id: 'members', label: 'Members', count: symbol.members.length });
  }
  return links;
}

function SectionHeading({
  children,
  style,
}: {
  children: React.ReactNode;
  style: KindStyle;
}): React.ReactElement {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-xl font-semibold tracking-tight">
      <span className={cn('h-5 w-1 rounded-full', style.accentBar)} aria-hidden />
      {children}
    </h2>
  );
}

function ClassBody({ symbol, style }: { symbol: DocClass; style: KindStyle }): React.ReactElement {
  const properties = symbol.properties ?? [];
  const methods = symbol.methods ?? [];
  const ctorParams = symbol.constructor?.params ?? [];
  return (
    <div className="mt-12 space-y-12">
      {symbol.constructor ? (
        <section id="constructor" className="scroll-mt-24">
          <SectionHeading style={style}>Constructor</SectionHeading>
          <MemberCard
            name={`new ${symbol.name}`}
            signature={`(${ctorParams.map(formatParam).join(', ')})`}
            description={symbol.constructor.description}
            style={style}
          />
          {ctorParams.length ? <ParamsTable params={ctorParams} /> : null}
        </section>
      ) : null}
      {properties.length ? (
        <section id="properties" className="scroll-mt-24">
          <SectionHeading style={style}>Properties</SectionHeading>
          <div className="grid gap-3 lg:grid-cols-2">
            {properties.map((p) => (
              <MemberCard
                key={p.name}
                name={p.name}
                type={`${p.optional ? '?' : ''}: ${p.type}${p.readonly ? ' (readonly)' : ''}`}
                description={p.description}
                style={style}
              />
            ))}
          </div>
        </section>
      ) : null}
      {methods.length ? (
        <section id="methods" className="scroll-mt-24">
          <SectionHeading style={style}>Methods</SectionHeading>
          <div className="space-y-3">
            {methods.map((m) => (
              <MemberCard
                key={m.name}
                name={m.name}
                type={`(${(m.params ?? []).map(formatParam).join(', ')}): ${m.returns}`}
                description={m.description}
                deprecated={m.deprecated}
                style={style}>
                {(m.params ?? []).length ? <ParamsTable params={m.params ?? []} /> : null}
              </MemberCard>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InterfaceBody({
  symbol,
  style,
}: {
  symbol: DocInterface;
  style: KindStyle;
}): React.ReactElement {
  const properties = symbol.properties ?? [];
  const methods = symbol.methods ?? [];
  const unionMembers = symbol.unionMembers ?? [];
  return (
    <div className="mt-12 space-y-12">
      {symbol.typeSignature ? (
        <section id="type" className="scroll-mt-24">
          <SectionHeading style={style}>Type</SectionHeading>
          <div className="overflow-x-auto rounded-xl border border-border bg-[hsl(var(--code-bg))] p-4">
            <TypeText type={symbol.typeSignature} className="font-mono text-sm leading-6" />
          </div>
        </section>
      ) : null}
      {unionMembers.length ? (
        <section id="members" className="scroll-mt-24">
          <SectionHeading style={style}>Members</SectionHeading>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {unionMembers.map((m) => (
                  <tr key={String(m.value)} className="border-t border-border">
                    <td className="px-3 py-2">
                      <TypeText
                        type={typeof m.value === 'string' ? `'${m.value}'` : String(m.value)}
                        className="font-mono text-sm text-emerald-600 dark:text-emerald-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {properties.length || (!symbol.typeSignature && !unionMembers.length) ? (
        <section id="properties" className="scroll-mt-24">
          <SectionHeading style={style}>Properties</SectionHeading>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documented properties.</p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {properties.map((p) => (
                <MemberCard
                  key={p.name}
                  name={p.name}
                  type={`${p.optional ? '?' : ''}: ${p.type}`}
                  description={p.description}
                  style={style}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
      {methods.length ? (
        <section id="methods" className="scroll-mt-24">
          <SectionHeading style={style}>Methods</SectionHeading>
          <div className="space-y-3">
            {methods.map((m) => (
              <MemberCard
                key={m.name}
                name={m.name}
                type={`(${(m.params ?? []).map(formatParam).join(', ')}): ${m.returns}`}
                description={m.description}
                style={style}>
                {(m.params ?? []).length ? <ParamsTable params={m.params ?? []} /> : null}
              </MemberCard>
            ))}
          </div>
        </section>
      ) : null}
      {symbol.see?.length ? (
        <section id="see-also" className="scroll-mt-24">
          <SectionHeading style={style}>See also</SectionHeading>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {symbol.see.map((s) => (
              <li key={s}>
                <DocDescription text={s} className="inline" as="span" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function EnumBody({ symbol, style }: { symbol: DocEnum; style: KindStyle }): React.ReactElement {
  const members = symbol.members ?? [];
  return (
    <section id="members" className="mt-12 scroll-mt-24">
      <SectionHeading style={style}>Members</SectionHeading>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.name}
                className="border-t border-border transition-colors hover:bg-muted/30">
                <td className={cn('px-3 py-2 font-mono font-medium', style.accentText)}>
                  {m.name}
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {JSON.stringify(m.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatParam(p: DocParam): string {
  return `${p.name}${p.optional ? '?' : ''}: ${p.type}`;
}

function MemberCard({
  name,
  type,
  signature,
  description,
  deprecated,
  style,
  children,
}: {
  name: string;
  type?: string;
  signature?: string;
  description?: string;
  deprecated?: boolean | string;
  style: KindStyle;
  children?: React.ReactNode;
}): React.ReactElement {
  const typeStr = type ?? signature ?? '';
  return (
    <div
      id={name}
      className="group scroll-mt-24 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/60">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 font-mono text-sm">
        <span className={cn('font-semibold text-foreground transition-colors', style.memberHover)}>
          {name}
        </span>
        {typeStr ? <TypeText type={typeStr} className="text-[13px] text-muted-foreground" /> : null}
      </div>
      {deprecated ? (
        <p className="mt-2 inline-flex rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500">
          Deprecated{typeof deprecated === 'string' ? `: ${deprecated}` : ''}
        </p>
      ) : null}
      {description ? (
        <DocDescription
          text={description}
          className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground"
        />
      ) : null}
      {children}
    </div>
  );
}

function ParamsTable({ params }: { params: DocParam[] }): React.ReactElement {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Param</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-t border-border">
              <td className="px-3 py-2 font-mono">
                {p.name}
                {p.optional ? '?' : ''}
              </td>
              <td className="px-3 py-2">
                <TypeText type={p.type} className="font-mono text-xs" />
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {p.description ? <DocDescription text={p.description} className="m-0" /> : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
