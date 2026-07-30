import type { MetadataRoute } from 'next';
import { loadApiDocsFor, loadVersions } from '@/lib/api-docs';
import { getExamples } from '@/lib/examples';
import { getGuideSlugs } from '@/lib/guides';
import { loadOpenApi } from '@/lib/openapi';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-static';

function entry(
  pathname: string,
  opts?: Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>,
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(pathname),
    lastModified: new Date(),
    changeFrequency: opts?.changeFrequency ?? 'weekly',
    priority: opts?.priority ?? 0.5,
  };
}

function symbolEntries(basePath: string, version?: string): MetadataRoute.Sitemap {
  const docs = loadApiDocsFor(version);
  const out: MetadataRoute.Sitemap = [];
  for (const c of docs.classes) {
    out.push(entry(`${basePath}/class/${c.name}`));
  }
  for (const i of docs.interfaces) {
    out.push(entry(`${basePath}/interface/${i.name}`));
  }
  for (const e of docs.enums) {
    out.push(entry(`${basePath}/enum/${e.name}`));
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const { versions } = loadVersions();
  const urls: MetadataRoute.Sitemap = [
    entry('/', { changeFrequency: 'weekly', priority: 1 }),
    entry('/guides', { changeFrequency: 'weekly', priority: 0.9 }),
    entry('/docs', { changeFrequency: 'weekly', priority: 0.9 }),
    entry('/rest', { changeFrequency: 'weekly', priority: 0.8 }),
    entry('/examples', { changeFrequency: 'monthly', priority: 0.7 }),
    entry('/changelog', { changeFrequency: 'weekly', priority: 0.6 }),
  ];

  for (const slug of getGuideSlugs()) {
    urls.push(entry(`/guides/${slug}`, { changeFrequency: 'monthly', priority: 0.7 }));
  }

  urls.push(...symbolEntries('/docs'));

  for (const version of versions) {
    urls.push(entry(`/docs/v/${version}`, { changeFrequency: 'monthly', priority: 0.6 }));
    urls.push(...symbolEntries(`/docs/v/${version}`, version));

    urls.push(entry(`/guides/v/${version}`, { changeFrequency: 'monthly', priority: 0.6 }));
    for (const slug of getGuideSlugs(version)) {
      urls.push(
        entry(`/guides/v/${version}/${slug}`, { changeFrequency: 'monthly', priority: 0.5 }),
      );
    }
  }

  for (const op of loadOpenApi().operations) {
    urls.push(entry(`/rest/${op.operationId}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  for (const example of getExamples()) {
    urls.push(entry(`/examples/${example.slug}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  return urls;
}
