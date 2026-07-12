import { AlertTriangle, Plus, RefreshCw, Sparkles, Trash2, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { changelogEntries } from '@/data/changelog';

export const metadata = { title: 'Changelog' };

interface SectionStyle {
  icon: LucideIcon;
  wrap: string;
  dot: string;
}

const DEFAULT_STYLE: SectionStyle = {
  icon: Sparkles,
  wrap: 'bg-primary/10 text-primary',
  dot: 'bg-primary',
};

function sectionStyle(title: string): SectionStyle {
  const t = title.toLowerCase();
  if (/(break|remov|delet)/.test(t))
    return { icon: AlertTriangle, wrap: 'bg-rose-500/10 text-rose-500', dot: 'bg-rose-500' };
  if (/(add|new|feature)/.test(t))
    return { icon: Plus, wrap: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' };
  if (/(fix|patch|bug)/.test(t))
    return { icon: Wrench, wrap: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' };
  if (/(chang|updat|improv|rewrite)/.test(t))
    return { icon: RefreshCw, wrap: 'bg-sky-500/10 text-sky-500', dot: 'bg-sky-500' };
  if (/(deprecat)/.test(t))
    return { icon: Trash2, wrap: 'bg-orange-500/10 text-orange-500', dot: 'bg-orange-500' };
  return DEFAULT_STYLE;
}

export default function ChangelogPage(): React.ReactElement {
  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--content-pad)] py-12 sm:py-16">
      <header className="mb-12">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-primary/80">
          Release history
        </p>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-semibold tracking-tight">
          Changelog
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          New features, fixes, and deliberate breaking changes in Fluxer.js.
        </p>
      </header>

      <div className="relative">
        <span
          className="absolute bottom-0 left-[7px] top-2 hidden w-px bg-border sm:block"
          aria-hidden
        />
        <div className="space-y-12">
          {changelogEntries.map((entry) => (
            <article key={entry.version} id={entry.version} className="scroll-mt-24 sm:pl-10">
              <span
                className="absolute left-0 mt-1.5 hidden h-4 w-4 rounded-full border-2 border-background bg-primary ring-2 ring-primary/30 sm:block"
                aria-hidden
              />
              <div className="mb-5 flex flex-wrap items-baseline gap-3">
                <h2 className="font-mono text-2xl font-semibold tracking-tight">
                  v{entry.version}
                </h2>
                <time className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {entry.date}
                </time>
              </div>

              <div className="space-y-4">
                {entry.sections.map((section) => {
                  const style = sectionStyle(section.title);
                  const Icon = style.icon;
                  return (
                    <section
                      key={section.title}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.wrap}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        {section.title}
                      </h3>
                      <ul className="space-y-2.5">
                        {section.items.map((item) => (
                          <li key={item} className="flex gap-3 text-sm leading-6">
                            <span
                              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                              aria-hidden
                            />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
