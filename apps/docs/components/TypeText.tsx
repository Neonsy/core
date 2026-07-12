import Link from 'next/link';
import { Fragment } from 'react';
import { getAllSymbols } from '@/lib/api-docs';

export type SymbolIndex = Map<string, { kind: string; name: string; href: string }>;

let cachedIndex: SymbolIndex | null = null;

export function getSymbolIndex(): SymbolIndex {
  if (cachedIndex) return cachedIndex;
  const map: SymbolIndex = new Map();
  for (const s of getAllSymbols()) {
    const kind = s.kind === 'class' ? 'class' : s.kind === 'enum' ? 'enum' : 'interface';
    map.set(s.name, {
      kind,
      name: s.name,
      href: `/docs/${kind}/${s.name}/`,
    });
  }
  cachedIndex = map;
  return map;
}

const TOKEN_RE =
  /(\b[A-Z][A-Za-z0-9_]+\b)|(\b[a-z][A-Za-z0-9_]*\b)|(\{|\}|\[|\]|\(|\)|\||&|,|<|>|\?|:|\.\.\.|=>|=|\s+|[^\sA-Za-z0-9_]+)/g;

const KEYWORDS = new Set([
  'string',
  'number',
  'boolean',
  'void',
  'null',
  'undefined',
  'never',
  'any',
  'unknown',
  'object',
  'bigint',
  'symbol',
  'true',
  'false',
  'readonly',
  'unique',
  'keyof',
  'typeof',
  'infer',
  'extends',
  'in',
  'out',
  'as',
  'is',
  'asserts',
  'const',
]);

export function TypeText({
  type,
  className,
}: {
  type: string;
  className?: string;
}): React.ReactElement {
  const index = getSymbolIndex();
  const parts: React.ReactNode[] = [];
  let key = 0;
  const matches = type.matchAll(TOKEN_RE);

  for (const m of matches) {
    const token = m[0];
    const linked = index.get(token);
    if (linked && !KEYWORDS.has(token)) {
      parts.push(
        <Link
          key={key++}
          href={linked.href}
          className="text-sky-600 underline decoration-sky-600/30 underline-offset-2 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-400/30"
        >
          {token}
        </Link>,
      );
    } else if (KEYWORDS.has(token)) {
      parts.push(
        <span key={key++} className="text-pink-600 dark:text-pink-400">
          {token}
        </span>,
      );
    } else if (/^['"`]/.test(token) || /^[0-9]/.test(token)) {
      parts.push(
        <span key={key++} className="text-emerald-600 dark:text-emerald-400">
          {token}
        </span>,
      );
    } else {
      parts.push(<Fragment key={key++}>{token}</Fragment>);
    }
  }

  return <code className={className}>{parts.length ? parts : type}</code>;
}

/** Render description text with `{@link Name}` → SDK links. */
export function DocDescription({
  text,
  className,
  as: Tag = 'p',
}: {
  text: string;
  className?: string;
  as?: 'p' | 'span';
}): React.ReactElement {
  const index = getSymbolIndex();
  const parts: React.ReactNode[] = [];
  const re = /\{@link\s+([^}\s]+)(?:\s+[^}]*)?\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    }
    const name = m[1]!.replace(/^#/, '').split(/[.|]/)[0]!;
    const hit = index.get(name);
    if (hit) {
      parts.push(
        <Link key={k++} href={hit.href} className="font-medium text-primary hover:underline">
          {name}
        </Link>,
      );
    } else {
      parts.push(
        <code key={k++} className="rounded bg-muted px-1 text-[0.9em]">
          {name}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <Tag className={className}>{parts.length ? parts : text}</Tag>;
}
