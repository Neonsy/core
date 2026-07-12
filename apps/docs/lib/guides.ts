import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface GuideFrontmatter {
  title: string;
  description: string;
  category: string;
  order: number;
}

export interface GuideMeta extends GuideFrontmatter {
  slug: string;
}

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');

export function getGuideSlugs(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getAllGuides(): GuideMeta[] {
  return getGuideSlugs()
    .map((slug) => {
      const raw = fs.readFileSync(path.join(GUIDES_DIR, `${slug}.mdx`), 'utf8');
      const { data } = matter(raw);
      return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ''),
        category: String(data.category ?? 'other'),
        order: Number(data.order ?? 999),
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getGuideBySlug(slug: string): { meta: GuideMeta; content: string } | null {
  const file = path.join(GUIDES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  return {
    meta: {
      slug,
      title: String(data.title ?? slug),
      description: String(data.description ?? ''),
      category: String(data.category ?? 'other'),
      order: Number(data.order ?? 999),
    },
    content,
  };
}

export function getGuidesByCategory(): Record<string, GuideMeta[]> {
  const grouped: Record<string, GuideMeta[]> = {};
  for (const g of getAllGuides()) {
    (grouped[g.category] ??= []).push(g);
  }
  return grouped;
}
