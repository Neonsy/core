import { getAllGuides } from './guides';
import { loadApiDocs } from './api-docs';
import { loadOpenApi } from './openapi';

export type SearchKind = 'guide' | 'class' | 'interface' | 'enum' | 'rest';

export interface SearchItem {
  id: string;
  kind: SearchKind;
  title: string;
  description: string;
  href: string;
  package?: string;
  /** Extra keywords for fuzzy match (paths, methods, aliases). */
  keywords?: string;
}

export function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  for (const g of getAllGuides()) {
    items.push({
      id: `guide:${g.slug}`,
      kind: 'guide',
      title: g.title,
      description: g.description,
      href: `/guides/${g.slug}/`,
      keywords: `${g.slug} ${g.category}`,
    });
  }

  const api = loadApiDocs();
  for (const c of api.classes) {
    items.push({
      id: c.id,
      kind: 'class',
      title: c.name,
      description: c.description ?? '',
      href: `/docs/class/${c.name}/`,
      package: c.package,
      keywords: c.package ?? '',
    });
  }
  for (const i of api.interfaces) {
    items.push({
      id: i.id,
      kind: 'interface',
      title: i.name,
      description: i.description ?? '',
      href: `/docs/interface/${i.name}/`,
      package: i.package,
      keywords: i.package ?? '',
    });
  }
  for (const e of api.enums) {
    items.push({
      id: e.id,
      kind: 'enum',
      title: e.name,
      description: e.description ?? '',
      href: `/docs/enum/${e.name}/`,
      package: e.package,
      keywords: e.package ?? '',
    });
  }

  for (const op of loadOpenApi().operations) {
    items.push({
      id: `rest:${op.operationId}`,
      kind: 'rest',
      title: `${op.method.toUpperCase()} ${op.path}`,
      description: op.summary ?? op.description ?? '',
      href: `/rest/${op.operationId}/`,
      keywords: `${op.operationId} ${op.method} ${op.path} ${(op.tags ?? []).join(' ')}`,
    });
  }

  return items;
}
