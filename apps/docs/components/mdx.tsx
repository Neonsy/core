'use client';

import { AlertTriangle, Lightbulb } from 'lucide-react';
import { Children, isValidElement, type ReactNode, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Tip({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <aside className="my-6 flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 text-sm leading-relaxed text-foreground">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="min-w-0 [&_p]:m-0">{children}</div>
    </aside>
  );
}

export function Warning({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <aside
      role="note"
      className="my-6 flex gap-3 rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-3.5 text-sm leading-relaxed text-foreground">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-hidden />
      <div className="min-w-0 [&_p]:m-0 [&_strong]:font-semibold">{children}</div>
    </aside>
  );
}

function extractTitle(node: ReactNode, fallback: string): string {
  if (!isValidElement(node)) return fallback;
  const props = node.props as { title?: string; 'data-title'?: string; children?: ReactNode };
  if (typeof props.title === 'string') return props.title;
  if (typeof props['data-title'] === 'string') return props['data-title'];
  // next-mdx-remote may put title on pre/code
  if (isValidElement(props.children)) {
    const childProps = props.children.props as { title?: string };
    if (typeof childProps.title === 'string') return childProps.title;
  }
  return fallback;
}

export function CodeTabs({ children }: { children: ReactNode }): React.ReactElement {
  const kids = useMemo(() => Children.toArray(children).filter(Boolean), [children]);
  const labels = kids.map((child, i) => extractTitle(child, `Option ${i + 1}`));
  const defaultValue = 'tab-0';

  return (
    <Tabs
      defaultValue={defaultValue}
      className="my-6 overflow-hidden rounded-xl border border-border bg-card not-prose shadow-sm">
      <div className="border-b border-border bg-muted/40 px-2 pt-2">
        <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
          {labels.map((label, i) => (
            <TabsTrigger
              key={`${label}-${i}`}
              value={`tab-${i}`}
              className="rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {kids.map((child, i) => (
        <TabsContent
          key={i}
          value={`tab-${i}`}
          className="m-0 [&_.code-frame]:my-0 [&_.code-frame]:rounded-none [&_.code-frame]:border-0 [&_.code-frame]:shadow-none">
          {child}
        </TabsContent>
      ))}
    </Tabs>
  );
}
