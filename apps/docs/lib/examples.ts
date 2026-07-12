import fs from 'node:fs';
import path from 'node:path';

export interface ExampleMeta {
  file: string;
  slug: string;
  title: string;
  description: string;
  /** Approx line count for display. */
  lines: number;
}

export interface Example extends ExampleMeta {
  code: string;
}

function resolveExamplesDir(): string {
  const candidates = [
    path.join(process.cwd(), '..', '..', 'examples'),
    path.join(process.cwd(), 'examples'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0]!;
}

const DIR = resolveExamplesDir();

function isExampleFile(f: string): boolean {
  return f.endsWith('-bot.js') || f === 'minimal-bot.js';
}

function humanTitle(file: string): string {
  return file
    .replace(/\.js$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pull the title (first JSDoc line) and description (second line) from a source file. */
function parseMeta(file: string, raw: string): { title: string; description: string } {
  const titleMatch = raw.match(/^\/\*\*[\s\S]*?\*\s*(.+)$/m);
  const descMatch = raw.match(/^\/\*\*[\s\S]*?\n\s*\*\s*(.+)\n/m);
  const title = titleMatch?.[1]?.replace(/\*\/.*/, '').trim() || humanTitle(file);
  const description = descMatch?.[1]?.trim() || 'Example bot script.';
  return { title, description };
}

export function getExamples(): ExampleMeta[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter(isExampleFile)
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
      const { title, description } = parseMeta(file, raw);
      return {
        file,
        slug: file.replace(/\.js$/, ''),
        title,
        description,
        lines: raw.split('\n').length,
      };
    });
}

export function getExample(slug: string): Example | null {
  const file = `${slug}.js`;
  const full = path.join(DIR, file);
  if (!isExampleFile(file) || !fs.existsSync(full)) return null;
  const code = fs.readFileSync(full, 'utf8');
  const { title, description } = parseMeta(file, code);
  return {
    file,
    slug,
    title,
    description,
    lines: code.split('\n').length,
    code,
  };
}

export const EXAMPLES_REPO = 'https://github.com/fluxerjs/core/blob/main/examples';

/** Sidebar links for `/examples` (flat list + optional active slug). */
export function getExamplesSidebarItems(active?: string): {
  href: string;
  label: string;
  active?: boolean;
  hint?: string;
}[] {
  const examples = getExamples();
  return [
    {
      href: '/examples/',
      label: 'All examples',
      active: !active,
    },
    ...examples.map((ex) => ({
      href: `/examples/${ex.slug}/`,
      label: ex.title,
      active: ex.slug === active,
      hint: ex.file,
    })),
  ];
}
