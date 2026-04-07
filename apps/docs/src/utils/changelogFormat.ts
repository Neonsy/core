import type { ChangelogEntry } from '../data/changelog';

const BREAKING_PREFIX = /^\*\*Breaking:\*\*\s*/i;

/** Detect Fluxer changelog bullets that start with **Breaking:** */
export function isBreakingChangelogItem(raw: string): boolean {
  return BREAKING_PREFIX.test(raw.trim());
}

/** Remove the **Breaking:** prefix for display (trimmed). */
export function stripBreakingPrefix(raw: string): string {
  return raw.replace(BREAKING_PREFIX, '').trim();
}

/** Split `**bold**` segments for safe rendering (no HTML injection). */
export function splitBoldSegments(text: string): { text: string; bold?: boolean }[] {
  const parts: { text: string; bold?: boolean }[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  for (;;) {
    const m = re.exec(text);
    if (m === null) break;
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    const inner = m[1];
    if (inner !== undefined) parts.push({ text: inner, bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  if (parts.length === 0) parts.push({ text });
  return parts;
}

export function breakingItemCountForEntry(entry: ChangelogEntry): number {
  let n = 0;
  for (const section of entry.sections) {
    for (const item of section.items) {
      if (isBreakingChangelogItem(item)) n++;
    }
  }
  return n;
}
