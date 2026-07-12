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

function parseDocsPath(pathname: string | null): {
  active: string;
  kind?: string;
  name?: string;
} {
  if (!pathname) return { active: 'latest' };

  const versioned = pathname.match(
    /^\/docs\/v\/([^/]+)(?:\/(class|interface|enum)\/([^/]+))?/,
  );
  if (versioned) {
    return {
      active: versioned[1]!,
      kind: versioned[2],
      name: versioned[3] ? decodeURIComponent(versioned[3]) : undefined,
    };
  }

  const latestSymbol = pathname.match(/^\/docs\/(class|interface|enum)\/([^/]+)/);
  if (latestSymbol) {
    return {
      active: 'latest',
      kind: latestSymbol[1],
      name: decodeURIComponent(latestSymbol[2]!),
    };
  }

  return { active: 'latest' };
}

function hrefForVersion(
  target: string,
  onDocs: boolean,
  kind?: string,
  name?: string,
): string {
  if (!onDocs) {
    return target === 'latest' ? '/docs/' : `/docs/v/${target}/`;
  }
  const base = target === 'latest' ? '/docs' : `/docs/v/${target}`;
  if (kind && name) return `${base}/${kind}/${name}/`;
  return `${base}/`;
}

export function VersionPicker({
  latest,
  versions,
  className,
}: VersionPickerProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const onDocs = Boolean(pathname?.startsWith('/docs'));
  const { active, kind, name } = parseDocsPath(pathname);

  const options: { value: string; label: string; isLatest: boolean }[] = [
    { value: 'latest', label: latest, isLatest: true },
    ...versions
      .filter((v) => v !== latest)
      .map((v) => ({ value: v, label: v, isLatest: false })),
  ];

  // If active is a tagged version that equals latest string, still show as tagged path value
  const display =
    active === 'latest'
      ? latest
      : active;

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
                onSelect={() => router.push(hrefForVersion(o.value, onDocs, kind, name))}
                className={cn('cursor-pointer justify-between gap-4 font-mono text-xs', selected && 'bg-accent')}
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
