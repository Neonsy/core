'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListTree } from 'lucide-react';
import type { TocHeading } from '@/components/OnPageToc';
import { cn } from '@/lib/utils';

export function OnPageTocClient({
  headings,
}: {
  headings: TocHeading[];
}): React.ReactElement | null {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');

  useEffect(() => {
    if (!headings.length) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0]?.target;
        if (first?.id) setActiveId(first.id);
      },
      {
        rootMargin: '-80px 0px -65% 0px',
        threshold: [0, 0.25, 1],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const activeIndex = Math.max(
    0,
    headings.findIndex((h) => h.id === activeId),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground">
          <ListTree className="h-3.5 w-3.5 text-primary" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">On this page</p>
        </div>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {activeIndex + 1}/{headings.length}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-border/80">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{
            width: `${((activeIndex + 1) / headings.length) * 100}%`,
          }}
        />
      </div>

      <nav className="relative flex flex-col gap-0.5 text-[13px]">
        <span
          className="absolute bottom-1 left-[5px] top-1 w-px bg-border"
          aria-hidden
        />
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <Link
              key={`${h.id}-${h.text}`}
              href={`#${h.id}`}
              onClick={() => setActiveId(h.id)}
              className={cn(
                'group relative py-1.5 transition-colors duration-150',
                h.depth === 3 ? 'pl-6' : 'pl-4',
                active
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 transition-all duration-200',
                  active
                    ? 'border-primary bg-primary scale-110 shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]'
                    : 'border-border bg-background group-hover:border-primary/50',
                )}
                aria-hidden
              />
              <span className="line-clamp-2">{h.text}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
