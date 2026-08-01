import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bot,
  Database,
  ExternalLink,
  Hammer,
  Headphones,
  IdCard,
  Layers,
  MessageSquare,
  Paperclip,
  Rocket,
  Shield,
  Smile,
  Timer,
  Webhook,
} from 'lucide-react';
import Link from 'next/link';
import { HelpCallout } from '@/components/FluxerInvite';
import { PageShell } from '@/components/PageShell';
import {
  EXAMPLES_REPO,
  type ExampleMeta,
  getExamples,
  getExamplesSidebarItems,
} from '@/lib/examples';

export const metadata = { title: 'Examples' };

const FALLBACK: ExampleMeta[] = [
  {
    file: 'minimal-bot.js',
    slug: 'minimal-bot',
    title: 'Minimal bot',
    description: 'Smallest possible ready + login example.',
    lines: 20,
  },
  {
    file: 'cache-bot.js',
    slug: 'cache-bot',
    title: 'Cache bot',
    description: 'Custom limits, client.cache.stats(), and periodic sweeps.',
    lines: 80,
  },
  {
    file: 'first-steps-bot.js',
    slug: 'first-steps-bot',
    title: 'First steps',
    description: 'Hello, avatar, embed, and permissions.',
    lines: 120,
  },
  {
    file: 'ping-bot.js',
    slug: 'ping-bot',
    title: 'Ping bot',
    description: 'Prefix commands, embeds, DMs, and replies.',
    lines: 220,
  },
  {
    file: 'voice-bot.js',
    slug: 'voice-bot',
    title: 'Voice bot',
    description: 'Join VC and play audio or video. Voice APIs are being reworked.',
    lines: 220,
  },
  {
    file: 'info-bot.js',
    slug: 'info-bot',
    title: 'Info bot',
    description: 'User, server, and role profile helpers.',
    lines: 350,
  },
  {
    file: 'collectors-bot.js',
    slug: 'collectors-bot',
    title: 'Collectors',
    description: 'Timed message and reaction prompts.',
    lines: 90,
  },
  {
    file: 'attachments-bot.js',
    slug: 'attachments-bot',
    title: 'Attachments',
    description: 'Buffers, spoilers, and URL uploads.',
    lines: 80,
  },
  {
    file: 'reaction-bot.js',
    slug: 'reaction-bot',
    title: 'Reactions',
    description: 'React to messages and handle reaction events.',
    lines: 60,
  },
  {
    file: 'reaction-roles-bot.js',
    slug: 'reaction-roles-bot',
    title: 'Reaction roles',
    description: 'Assign roles from reactions.',
    lines: 130,
  },
  {
    file: 'moderation-bot.js',
    slug: 'moderation-bot',
    title: 'Moderation',
    description: 'Kick, ban, and unban helpers.',
    lines: 180,
  },
  {
    file: 'webhook-bot.js',
    slug: 'webhook-bot',
    title: 'Webhooks',
    description: 'Send messages via webhooks.',
    lines: 200,
  },
  {
    file: 'multi-instance-bot.js',
    slug: 'multi-instance-bot',
    title: 'Multi-instance',
    description: 'Run against self-hosted instances.',
    lines: 200,
  },
];

interface Accent {
  icon: LucideIcon;
  ring: string;
  chip: string;
}

const ACCENTS: Record<string, Accent> = {
  'minimal-bot': {
    icon: Rocket,
    ring: 'hover:border-sky-500/50',
    chip: 'bg-sky-500/10 text-sky-500',
  },
  'cache-bot': {
    icon: Database,
    ring: 'hover:border-blue-500/50',
    chip: 'bg-blue-500/10 text-blue-500',
  },
  'ping-bot': {
    icon: Bot,
    ring: 'hover:border-indigo-500/50',
    chip: 'bg-indigo-500/10 text-indigo-500',
  },
  'first-steps-bot': {
    icon: MessageSquare,
    ring: 'hover:border-violet-500/50',
    chip: 'bg-violet-500/10 text-violet-500',
  },
  'voice-bot': {
    icon: Headphones,
    ring: 'hover:border-fuchsia-500/50',
    chip: 'bg-fuchsia-500/10 text-fuchsia-500',
  },
  'info-bot': {
    icon: IdCard,
    ring: 'hover:border-teal-500/50',
    chip: 'bg-teal-500/10 text-teal-500',
  },
  'collectors-bot': {
    icon: Timer,
    ring: 'hover:border-lime-500/50',
    chip: 'bg-lime-500/10 text-lime-500',
  },
  'attachments-bot': {
    icon: Paperclip,
    ring: 'hover:border-stone-500/50',
    chip: 'bg-stone-500/10 text-stone-500',
  },
  'multi-instance-bot': {
    icon: Layers,
    ring: 'hover:border-cyan-500/50',
    chip: 'bg-cyan-500/10 text-cyan-500',
  },
  'reaction-bot': {
    icon: Smile,
    ring: 'hover:border-amber-500/50',
    chip: 'bg-amber-500/10 text-amber-500',
  },
  'reaction-roles-bot': {
    icon: Smile,
    ring: 'hover:border-orange-500/50',
    chip: 'bg-orange-500/10 text-orange-500',
  },
  'moderation-bot': {
    icon: Shield,
    ring: 'hover:border-rose-500/50',
    chip: 'bg-rose-500/10 text-rose-500',
  },
  'webhook-bot': {
    icon: Webhook,
    ring: 'hover:border-emerald-500/50',
    chip: 'bg-emerald-500/10 text-emerald-500',
  },
};

const DEFAULT_ACCENT: Accent = {
  icon: Hammer,
  ring: 'hover:border-primary/40',
  chip: 'bg-primary/10 text-primary',
};

export default function ExamplesPage(): React.ReactElement {
  let examples = FALLBACK;
  try {
    const loaded = getExamples();
    if (loaded.length) examples = loaded;
  } catch {
    // static export / missing examples dir
  }

  let sidebarItems = getExamplesSidebarItems();
  if (!sidebarItems.length || sidebarItems.length === 1) {
    sidebarItems = [
      { href: '/examples/', label: 'All examples', active: true },
      ...examples.map((ex) => ({
        href: `/examples/${ex.slug}/`,
        label: ex.title,
      })),
    ];
  }

  return (
    <PageShell sidebarTitle="Examples" sidebarItems={sidebarItems} wide>
      <header className="mb-10">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-primary/80">
          Repository · {examples.length} examples
        </p>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-semibold tracking-tight">
          Examples
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Runnable programs covering the SDK from a minimal login to voice and moderation. Read the
          full source here, or open it on GitHub.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {examples.map((ex) => {
          const accent = ACCENTS[ex.slug] ?? DEFAULT_ACCENT;
          const Icon = accent.icon;
          return (
            <div
              key={ex.file}
              className={`group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 ${accent.ring}`}>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.chip}`}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {ex.lines} lines
                </span>
              </div>
              <h2 className="mt-4 text-sm font-semibold">
                <Link href={`/examples/${ex.slug}/`} className="after:absolute after:inset-0">
                  {ex.title}
                </Link>
              </h2>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">
                {ex.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  View source
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
                <a
                  href={`${EXAMPLES_REPO}/${ex.file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="relative z-10 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  GitHub
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        Prefer a walkthrough? Start with the{' '}
        <Link href="/guides/basic-bot/" className="font-medium text-primary hover:underline">
          Basic Bot guide
        </Link>
        .
      </p>
      <HelpCallout className="mt-4" />
    </PageShell>
  );
}
