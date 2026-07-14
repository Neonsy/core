'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Boxes,
  Braces,
  History,
  Menu,
  Search,
  Server,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FluxerInviteIcon } from './FluxerInvite';
import { FluxerLogo } from './FluxerLogo';
import { ThemeToggle } from './ThemeToggle';
import { VersionPicker } from './VersionPicker';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

function GitHubIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const NAV: {
  label: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  accentHover: string;
}[] = [
  {
    label: 'Guides',
    href: '/guides/',
    icon: BookOpen,
    accent: 'text-primary',
    accentHover: 'group-hover:text-primary',
  },
  {
    label: 'SDK',
    href: '/docs/',
    icon: Braces,
    accent: 'text-sky-500',
    accentHover: 'group-hover:text-sky-500',
  },
  {
    label: 'REST',
    href: '/rest/',
    icon: Server,
    accent: 'text-emerald-500',
    accentHover: 'group-hover:text-emerald-500',
  },
  {
    label: 'Changelog',
    href: '/changelog/',
    icon: History,
    accent: 'text-amber-500',
    accentHover: 'group-hover:text-amber-500',
  },
  {
    label: 'Examples',
    href: '/examples/',
    icon: Boxes,
    accent: 'text-pink-500',
    accentHover: 'group-hover:text-pink-500',
  },
];

export function SiteHeader({
  onOpenSearch,
  latest,
  versions,
}: {
  onOpenSearch?: () => void;
  latest: string;
  versions: string[];
}): React.ReactElement {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.platform ??
      navigator.userAgent;
    setShortcut(/mac|iphone|ipad|ipod/i.test(platform) ? '⌘K' : 'Ctrl K');
  }, []);

  return (
    <header className="sticky top-0 z-40 h-[var(--header-h)] border-b border-border/80 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-full w-full items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col p-0">
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2">
                <FluxerLogo className="h-6 w-6" />
                Fluxer.js
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1 p-3">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname?.startsWith(item.href.replace(/\/$/, '')) || pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/60 ring-1 ring-border">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? item.accent : cn('text-muted-foreground', item.accentHover),
                        )}
                      />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
          <FluxerLogo className="h-7 w-7 shrink-0" />
          <span className="truncate font-display text-base sm:text-lg">Fluxer.js</span>
        </Link>

        <VersionPicker latest={latest} versions={versions} />

        <nav className="ml-1 hidden items-center gap-0.5 rounded-full border border-border/70 bg-card/50 p-1 lg:flex">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname?.startsWith(item.href.replace(/\/$/, ''));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active ? item.accent : cn('text-muted-foreground/70', item.accentHover),
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card sm:flex md:w-72 lg:w-80"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="text-sm">Search docs…</span>
            <kbd className="pointer-events-none ml-auto shrink-0 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {shortcut ?? '\u00a0'}
            </kbd>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={onOpenSearch}
            aria-label="Search"
          >
            <Search />
          </Button>
          <FluxerInviteIcon />
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/fluxerjs/core" target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitHubIcon className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
