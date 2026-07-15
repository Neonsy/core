'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface VersionPickerProps {
  latest: string;
  /** Tagged versions (semver without v), newest first. */
  versions: string[];
  className?: string;
}

type DocsSection = 'docs' | 'guides' | 'other';

function parseSitePath(pathname: string | null): {
  section: DocsSection;
  active: string;
  kind?: string;
  name?: string;
  guideSlug?: string;
} {
  if (!pathname) return { section: 'other', active: 'latest' };

  const versionedGuides = pathname.match(/^\/guides\/v\/([^/]+)(?:\/([^/]+))?/);
  if (versionedGuides) {
    return {
      section: 'guides',
      active: versionedGuides[1]!,
      guideSlug: versionedGuides[2] ? decodeURIComponent(versionedGuides[2]) : undefined,
    };
  }

  if (pathname === '/guides' || pathname === '/guides/' || pathname.startsWith('/guides/')) {
    const latestGuide = pathname.match(/^\/guides\/([^/]+)\/?$/);
    return {
      section: 'guides',
      active: 'latest',
      guideSlug: latestGuide?.[1] ? decodeURIComponent(latestGuide[1]) : undefined,
    };
  }

  const versionedDocs = pathname.match(
    /^\/docs\/v\/([^/]+)(?:\/(class|interface|enum)\/([^/]+))?/,
  );
  if (versionedDocs) {
    return {
      section: 'docs',
      active: versionedDocs[1]!,
      kind: versionedDocs[2],
      name: versionedDocs[3] ? decodeURIComponent(versionedDocs[3]) : undefined,
    };
  }

  const latestSymbol = pathname.match(/^\/docs\/(class|interface|enum)\/([^/]+)/);
  if (latestSymbol) {
    return {
      section: 'docs',
      active: 'latest',
      kind: latestSymbol[1],
      name: decodeURIComponent(latestSymbol[2]!),
    };
  }

  if (pathname === '/docs' || pathname === '/docs/' || pathname.startsWith('/docs/')) {
    return { section: 'docs', active: 'latest' };
  }

  return { section: 'other', active: 'latest' };
}

function hrefForVersion(
  target: string,
  section: DocsSection,
  kind?: string,
  name?: string,
  guideSlug?: string,
): string {
  if (section === 'guides') {
    const base = target === 'latest' ? '/guides' : `/guides/v/${target}`;
    if (guideSlug) return `${base}/${guideSlug}/`;
    return `${base}/`;
  }

  if (section === 'docs') {
    const base = target === 'latest' ? '/docs' : `/docs/v/${target}`;
    if (kind && name) return `${base}/${kind}/${name}/`;
    return `${base}/`;
  }

  return target === 'latest' ? '/docs/' : `/docs/v/${target}/`;
}

export function VersionPicker({
  latest,
  versions,
  className,
}: VersionPickerProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { section, active, kind, name, guideSlug } = parseSitePath(pathname);

  const options: { value: string; label: string; isLatest: boolean }[] = [
    { value: 'latest', label: latest, isLatest: true },
    ...versions
      .filter((v) => v !== latest)
      .map((v) => ({ value: v, label: v, isLatest: false })),
  ];

  const display = active === 'latest' ? latest : active;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md border border-border/80 bg-card/70 px-2 font-mono text-xs font-medium text-foreground outline-none transition-colors',
            'hover:border-border hover:bg-card',
            'focus-visible:ring-2 focus-visible:ring-ring',
            'data-[state=open]:border-border data-[state=open]:bg-card',
            className,
          )}
          aria-label="SDK version"
        >
          <span>v{display}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={6} className="min-w-[9.5rem]">
        {options.map((o, i) => {
          const selected = active === o.value;
          return (
            <div key={o.value}>
              {i === 1 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                onSelect={() =>
                  router.push(hrefForVersion(o.value, section, kind, name, guideSlug))
                }
                className={cn(
                  'cursor-pointer justify-between gap-4 font-mono text-xs',
                  selected && 'bg-accent',
                )}
              >
                <span className="flex items-center gap-2">
                  <span>v{o.label}</span>
                  {o.isLatest ? (
                    <span className="font-sans text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      latest
                    </span>
                  ) : null}
                </span>
                {selected ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden /> : null}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
