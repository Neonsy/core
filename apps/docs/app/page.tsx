import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BookOpen, Braces, GitBranch, Server } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CodeBlock } from '@/components/CodeBlock';
import { CopyButton } from '@/components/CopyButton';
import { HelpCallout } from '@/components/FluxerInvite';
import { FluxerLogo } from '@/components/FluxerLogo';
import { Button } from '@/components/ui/button';
import { FLUXER_INVITE_URL } from '@/lib/community';

const INSTALL_CMD = 'pnpm add @fluxerjs/core';

interface Section {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const sections: Section[] = [
  {
    href: '/guides/',
    title: 'Guides',
    description: 'Start a bot, send messages, work with guilds, and handle events.',
    icon: BookOpen,
  },
  {
    href: '/docs/',
    title: 'SDK reference',
    description: 'Classes, methods, interfaces, and enums straight from the source.',
    icon: Braces,
  },
  {
    href: '/rest/',
    title: 'REST API',
    description: 'Every HTTP operation, request body, parameter, and response schema.',
    icon: Server,
  },
  {
    href: '/guides/migration/',
    title: '2.0 migration',
    description: 'Breaking changes and direct replacements for upgrading.',
    icon: GitBranch,
  },
];

const SNIPPET = `import { Client, Events } from '@fluxerjs/core';

const client = new Client();

client.on(Events.Ready, () => {
  console.log('Ready');
});

client.on(Events.MessageCreate, async (message) => {
  if (message.content === '!ping') {
    await message.reply('Pong');
  }
});

await client.login(process.env.FLUXER_BOT_TOKEN);`;

export default async function HomePage(): Promise<React.ReactElement> {
  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-[var(--content-pad)] py-16 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,28rem)] lg:items-end lg:gap-16">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <FluxerLogo className="h-14 w-14 sm:h-16 sm:w-16" />
              <div>
                <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Fluxer
                </p>
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                  JavaScript SDK · v2
                </p>
              </div>
            </div>

            <h1 className="max-w-xl font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.03em]">
              Typed bots for the Fluxer API.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Managers return structures. Events are camelCase. The OpenAPI contract stays the
              source of truth from install to deploy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/guides/installation/">
                  Get started
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/examples/">Browse examples</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <a href={FLUXER_INVITE_URL} target="_blank" rel="noreferrer">
                  Need help? Join Fluxer
                </a>
              </Button>
            </div>

            <div className="mt-10 max-w-md overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/pnpm.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px]"
                    unoptimized
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    Install with pnpm
                  </span>
                </div>
                <Link
                  href="/guides/installation/"
                  className="text-xs font-medium text-primary hover:underline">
                  Full setup
                </Link>
              </div>
              <div className="flex items-center gap-1 px-2 py-2 pl-4">
                <code className="min-w-0 flex-1 truncate font-mono text-sm">
                  pnpm add <span className="text-primary">@fluxerjs/core</span>
                </code>
                <CopyButton code={INSTALL_CMD} />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <CodeBlock code={SNIPPET} lang="javascript" className="my-0" />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-[var(--content-pad)] py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Need voice? Install <code className="font-mono text-foreground">@fluxerjs/voice</code>{' '}
            and follow the{' '}
            <Link href="/guides/voice/" className="font-medium text-primary hover:underline">
              Voice guide
            </Link>
            . APIs there are changing soon.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              href="/guides/basic-bot/"
              className="font-medium text-foreground hover:text-primary">
              Basic bot →
            </Link>
            <Link href="/guides/events/" className="font-medium text-foreground hover:text-primary">
              Events →
            </Link>
            <Link
              href="/guides/builders/"
              className="font-medium text-foreground hover:text-primary">
              Builders →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-[var(--content-pad)] py-14 sm:py-20">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Explore the docs</h2>
          <p className="mt-2 text-muted-foreground">Pick a path and keep building.</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col bg-card p-6 transition-colors hover:bg-muted/40">
                <Icon
                  className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden
                />
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-[var(--content-pad)] py-10">
        <HelpCallout />
      </section>
    </main>
  );
}
