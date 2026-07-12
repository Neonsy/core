import { OnPageTocClient } from '@/components/OnPageTocClient';

export interface TocHeading {
  id: string;
  text: string;
  depth: number;
}

/** Match rehype-slug / github-slugger style ids. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/** Extract ## / ### headings from MDX, skipping fenced code. */
export function extractToc(content: string): TocHeading[] {
  const withoutCode = content.replace(/```[\s\S]*?```/g, '');
  const headings: TocHeading[] = [];
  const re = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(withoutCode)) !== null) {
    const depth = match[1]!.length;
    const text = match[2]!.replace(/#+$/, '').trim();
    if (!text) continue;
    headings.push({ id: slugifyHeading(text), text, depth });
  }
  return headings;
}

export function OnPageToc({ headings }: { headings: TocHeading[] }): React.ReactElement | null {
  if (!headings.length) return null;
  return <OnPageTocClient headings={headings} />;
}
