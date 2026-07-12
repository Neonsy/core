#!/usr/bin/env node
/**
 * Generate combined API documentation JSON from all SDK packages.
 *
 * Outputs:
 *   apps/docs/public/api/main.json          — latest (working tree)
 *   apps/docs/public/api/v<version>/main.json — one per v2.* git tag
 *   apps/docs/public/api/versions.json      — manifest
 *
 * Tag checkouts have no node_modules; docgen still emits signatures from the
 * TypeScript AST. Cross-package type text may be less precise than a fully
 * installed build — acceptable for reference docs.
 */

import { resolve, dirname, join } from 'path';
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  existsSync,
  rmSync,
} from 'fs';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { generateDocs } from '@fluxerjs/docgen';
import type { DocOutput } from '@fluxerjs/docgen';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const PACKAGES: { id: string; name: string; pkgPath: string }[] = [
  { id: 'core', name: '@fluxerjs/core', pkgPath: 'packages/fluxer-core' },
  { id: 'builders', name: '@fluxerjs/builders', pkgPath: 'packages/builders' },
  { id: 'rest', name: '@fluxerjs/rest', pkgPath: 'packages/rest' },
  { id: 'ws', name: '@fluxerjs/ws', pkgPath: 'packages/ws' },
  { id: 'voice', name: '@fluxerjs/voice', pkgPath: 'packages/voice' },
  { id: 'util', name: '@fluxerjs/util', pkgPath: 'packages/util' },
  { id: 'collection', name: '@fluxerjs/collection', pkgPath: 'packages/collection' },
  { id: 'types', name: '@fluxerjs/types', pkgPath: 'packages/types' },
];

const API_DIR = resolve(root, 'apps/docs/public/api');

export interface VersionsManifest {
  latest: string;
  versions: string[];
}

function getVersion(repoRoot: string): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf-8')) as {
      version?: string;
    };
    return pkg.version ?? '2.0.0';
  } catch {
    return '2.0.0';
  }
}

function parseSemver(version: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemverDesc(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return b.localeCompare(a);
  for (let i = 0; i < 3; i++) {
    if (pa[i]! !== pb[i]!) return pb[i]! - pa[i]!;
  }
  return 0;
}

function isV2OrNewer(version: string): boolean {
  const p = parseSemver(version);
  return p !== null && p[0] >= 2;
}

/** Discover v2.* tags (>= 2.0.0), newest first. */
function listV2Tags(): string[] {
  try {
    const out = execFileSync('git', ['tag', '--list', 'v2.*'], {
      cwd: root,
      encoding: 'utf-8',
    });
    const versions = out
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('v') ? tag.slice(1) : tag))
      .filter(isV2OrNewer);
    return [...new Set(versions)].sort(compareSemverDesc);
  } catch (err) {
    console.warn('[generate-docs] Failed to list git tags:', err);
    return [];
  }
}

/**
 * Build combined DocOutput for a given repo root (working tree or worktree).
 * Uses the TypeScript compiler API only — no install/build of packages required.
 */
export function buildCombinedDocs(repoRoot: string, version: string): DocOutput {
  const allClasses: DocOutput['classes'] = [];
  const allInterfaces: DocOutput['interfaces'] = [];
  const allEnums: DocOutput['enums'] = [];
  const packages = new Set<string>();
  const seen = new Set<string>();
  const tempDir = resolve(API_DIR, '_temp');
  mkdirSync(tempDir, { recursive: true });

  for (const pkg of PACKAGES) {
    const pkgRoot = resolve(repoRoot, pkg.pkgPath);
    const tsconfigPath = resolve(pkgRoot, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) {
      console.warn(`[generate-docs] skip ${pkg.name}: no tsconfig at ${tsconfigPath}`);
      continue;
    }

    const tempFile = resolve(tempDir, `_temp_${pkg.id}.json`);
    try {
      generateDocs({
        entryPoints: ['src/index.ts'],
        tsconfigPath,
        packageName: pkg.name,
        outFile: tempFile,
        repoRoot,
      });
    } catch (err) {
      console.warn(`[generate-docs] skip ${pkg.name}:`, err);
      continue;
    }

    if (!existsSync(tempFile)) continue;
    const data = JSON.parse(readFileSync(tempFile, 'utf-8')) as DocOutput;
    unlinkSync(tempFile);

    for (const c of data.classes ?? []) {
      const key = c.id ?? `class:${c.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        allClasses.push({ ...c, id: key, kind: 'class', package: pkg.name });
        packages.add(pkg.name);
      }
    }
    for (const i of data.interfaces ?? []) {
      const key = i.id ?? `interface:${i.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        allInterfaces.push({ ...i, id: key, kind: 'interface', package: pkg.name });
        packages.add(pkg.name);
      }
    }
    for (const e of data.enums ?? []) {
      const key = e.id ?? `enum:${e.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        allEnums.push({ ...e, id: key, kind: 'enum', package: pkg.name });
        packages.add(pkg.name);
      }
    }
    console.log(`[generate-docs] ${pkg.name}`);
  }

  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  allClasses.sort((a, b) => a.name.localeCompare(b.name));
  allInterfaces.sort((a, b) => a.name.localeCompare(b.name));
  allEnums.sort((a, b) => a.name.localeCompare(b.name));

  return {
    meta: { generator: 'fluxer-docgen', version: '2', date: Date.now() },
    package: '@fluxerjs/core',
    version,
    packages: Array.from(packages).sort(),
    classes: allClasses,
    interfaces: allInterfaces,
    enums: allEnums,
  };
}

function writeDocsFile(filePath: string, docs: DocOutput): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
  console.log(
    `[generate-docs] -> ${filePath} (${docs.classes.length} classes, ${docs.interfaces.length} interfaces, ${docs.enums.length} enums)`,
  );
}

function generateTagDocs(version: string): boolean {
  const tag = `v${version}`;
  const worktreePath = join(tmpdir(), `fluxer-docs-${version}-${randomBytes(4).toString('hex')}`);
  console.log(`[generate-docs] worktree ${tag} -> ${worktreePath}`);

  try {
    execFileSync('git', ['worktree', 'add', '--detach', worktreePath, tag], {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    console.warn(`[generate-docs] failed to add worktree for ${tag}:`, err);
    return false;
  }

  try {
    const docs = buildCombinedDocs(worktreePath, version);
    writeDocsFile(resolve(API_DIR, `v${version}`, 'main.json'), docs);
    return true;
  } catch (err) {
    console.warn(`[generate-docs] failed to generate docs for ${tag}:`, err);
    return false;
  } finally {
    try {
      execFileSync('git', ['worktree', 'remove', '--force', worktreePath], {
        cwd: root,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch {
      try {
        rmSync(worktreePath, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
}

async function main(): Promise<void> {
  mkdirSync(API_DIR, { recursive: true });

  const latestVersion = getVersion(root);
  console.log(`[generate-docs] latest (working tree) ${latestVersion}`);
  const latestDocs = buildCombinedDocs(root, latestVersion);
  writeDocsFile(resolve(API_DIR, 'main.json'), latestDocs);

  const tags = listV2Tags();
  console.log(`[generate-docs] found ${tags.length} v2.* tag(s): ${tags.join(', ') || '(none)'}`);

  const generatedVersions: string[] = [];
  for (const version of tags) {
    try {
      if (generateTagDocs(version)) {
        generatedVersions.push(version);
      }
    } catch (err) {
      console.warn(`[generate-docs] skipping tag v${version}:`, err);
    }
  }

  // Manifest: tagged versions only (latest is always the working-tree build).
  // Include latestVersion in the list when it isn't already a tag so the picker
  // can show it, but versioned routes only cover tags that have a JSON file.
  const manifest: VersionsManifest = {
    latest: latestVersion,
    versions: generatedVersions,
  };
  const manifestPath = resolve(API_DIR, 'versions.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[generate-docs] -> ${manifestPath}`);
  console.log('[generate-docs] Done');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
