import { createHighlighter, type Highlighter } from 'shiki';

const LANGS = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'bash',
  'shell',
  'json',
  'yaml',
  'markdown',
  'md',
  'diff',
  'text',
  'html',
  'css',
] as const;

const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  yml: 'yaml',
  md: 'markdown',
  plaintext: 'text',
  plain: 'text',
  txt: 'text',
};

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['min-light', 'one-dark-pro'],
    langs: [...LANGS],
  });
  return highlighterPromise;
}

export function normalizeLang(lang?: string | null): string {
  if (!lang) return 'text';
  const raw = lang.trim().toLowerCase().replace(/^language-/, '');
  return LANG_ALIASES[raw] ?? raw;
}

export async function highlightCode(code: string, lang = 'typescript'): Promise<string> {
  const highlighter = await getHighlighter();
  const normalized = normalizeLang(lang);
  const loaded = highlighter.getLoadedLanguages();
  const language = loaded.includes(normalized as never) ? normalized : 'text';
  return highlighter.codeToHtml(code.replace(/\n$/, ''), {
    lang: language,
    themes: {
      light: 'min-light',
      dark: 'one-dark-pro',
    },
    defaultColor: false,
  });
}
