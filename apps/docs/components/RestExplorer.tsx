'use client';

import { ArrowUpRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface RestExplorerOperation {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
  tag: string;
  deprecated?: boolean;
}

interface MethodStyle {
  badge: string;
  hover: string;
}

const METHOD_STYLE: Record<string, MethodStyle> = {
  get: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-emerald-500/40',
  },
  post: {
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    hover: 'hover:border-indigo-500/40',
  },
  put: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    hover: 'hover:border-amber-500/40',
  },
  patch: {
    badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    hover: 'hover:border-pink-500/40',
  },
  delete: {
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    hover: 'hover:border-rose-500/40',
  },
};

const FALLBACK_METHOD: MethodStyle = {
  badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  hover: 'hover:border-primary/40',
};

const ROW = 72;
const GAP = 8;
const OVERSCAN = 12;

function scoreOp(op: RestExplorerOperation, q: string): number {
  if (!q) return 0;
  const path = op.path.toLowerCase();
  const summary = (op.summary ?? '').toLowerCase();
  const id = op.operationId.toLowerCase();
  const tag = op.tag.toLowerCase();
  const method = op.method.toLowerCase();

  if (path === q || id === q) return 100;
  if (path.startsWith(q) || id.startsWith(q)) return 90;
  if (path.includes(q)) return 80;
  if (method === q) return 75;
  if (summary.startsWith(q)) return 70;
  if (summary.includes(q) || id.includes(q)) return 60;
  if (tag.includes(q)) return 40;

  // token match (e.g. "guild member")
  const tokens = q.split(/\s+/).filter(Boolean);
  if (
    tokens.length > 1 &&
    tokens.every((t) => path.includes(t) || summary.includes(t) || id.includes(t))
  ) {
    return 55;
  }
  return -1;
}

export function RestExplorer({
  operations,
  tags,
}: {
  operations: RestExplorerOperation[];
  tags: string[];
}): React.ReactElement {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const rows = operations.filter((op) => {
      if (activeTag && op.tag !== activeTag) return false;
      if (activeMethod && op.method !== activeMethod) return false;
      if (!q) return true;
      return scoreOp(op, q) >= 0;
    });
    if (!q) return rows;
    return [...rows].sort((a, b) => scoreOp(b, q) - scoreOp(a, q));
  }, [operations, deferredQuery, activeTag, activeMethod]);

  const methods = useMemo(() => {
    const set = new Set(operations.map((o) => o.method));
    return ['get', 'post', 'put', 'patch', 'delete'].filter((m) => set.has(m));
  }, [operations]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: 30 });
  const total = filtered.length;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function update(): void {
      if (!el) return;
      const start = Math.max(0, Math.floor(el.scrollTop / ROW) - OVERSCAN);
      const visibleCount = Math.ceil(el.clientHeight / ROW) + OVERSCAN * 2;
      const end = Math.min(total, start + visibleCount);
      setRange({ start, end });
    }

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [total]);

  const visible = filtered.slice(range.start, range.end);
  const hasFilters = Boolean(query || activeTag || activeMethod);

  return (
    <div className="flex min-h-[min(70vh,42rem)] flex-col gap-4">
      <div className="shrink-0 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by path, method, tag, or summary…"
            className="h-11 pl-10 pr-10 text-sm"
            aria-label="Filter REST endpoints"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear filter">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill
            active={!activeMethod && !activeTag}
            onClick={() => {
              setActiveMethod(null);
              setActiveTag(null);
            }}>
            All
          </FilterPill>
          {methods.map((m) => {
            const style = METHOD_STYLE[m] ?? FALLBACK_METHOD;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMethod(activeMethod === m ? null : m)}
                className={cn(
                  'rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors',
                  activeMethod === m
                    ? `${style.badge} border-transparent`
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}>
                {m}
              </button>
            );
          })}
          {tags.length > 1
            ? tags.map((t) => (
                <FilterPill
                  key={t}
                  active={activeTag === t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}>
                  {t}
                </FilterPill>
              ))
            : null}
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {total}
            {hasFilters ? ` / ${operations.length}` : ''} endpoints
          </span>
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No endpoints match your filters.
        </p>
      ) : (
        <div
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/60 bg-card/30 p-2"
          role="list">
          <div className="relative w-full" style={{ height: total * ROW }}>
            {visible.map((op, i) => {
              const index = range.start + i;
              const style = METHOD_STYLE[op.method] ?? FALLBACK_METHOD;
              return (
                <Link
                  key={op.operationId}
                  href={`/rest/${op.operationId}/`}
                  role="listitem"
                  className={cn(
                    'group absolute inset-x-2 flex items-center gap-3 rounded-lg border border-transparent bg-card px-4 transition-colors',
                    style.hover,
                    'hover:border-border',
                  )}
                  style={{ top: index * ROW, height: ROW - GAP }}>
                  <span
                    className={cn(
                      'w-16 shrink-0 rounded-md px-2 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-wide',
                      style.badge,
                    )}>
                    {op.method}
                  </span>
                  <div className="min-w-0 flex-1">
                    <code className="block truncate font-mono text-xs text-foreground sm:text-[13px]">
                      {op.path}
                    </code>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {op.summary ?? op.operationId}
                      <span className="text-muted-foreground/60"> · {op.tag}</span>
                    </span>
                  </div>
                  {op.deprecated ? (
                    <span className="shrink-0 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-500">
                      deprecated
                    </span>
                  ) : null}
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-transparent bg-primary/15 text-primary'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}>
      {children}
    </button>
  );
}
