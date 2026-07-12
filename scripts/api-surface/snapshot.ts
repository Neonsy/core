/**
 * Snapshot public export names from package.json exports + built dist (or source index).
 * Migration reference only — not a cage.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'test-fixtures', 'api-baseline');

const PACKAGES: Array<{
  name: string;
  dir: string;
  entries: Array<{ subpath: string; file: string }>;
}> = [
  {
    name: '@fluxerjs/types',
    dir: 'packages/types',
    entries: [
      { subpath: '.', file: 'src/index.ts' },
      { subpath: './routes', file: 'src/subpath-routes.ts' },
    ],
  },
  {
    name: '@fluxerjs/util',
    dir: 'packages/util',
    entries: [{ subpath: '.', file: 'src/index.ts' }],
  },
  {
    name: '@fluxerjs/collection',
    dir: 'packages/collection',
    entries: [{ subpath: '.', file: 'src/index.ts' }],
  },
  {
    name: '@fluxerjs/rest',
    dir: 'packages/rest',
    entries: [
      { subpath: '.', file: 'src/index.ts' },
      { subpath: './request-manager', file: 'src/subpath-request-manager.ts' },
    ],
  },
  {
    name: '@fluxerjs/ws',
    dir: 'packages/ws',
    entries: [{ subpath: '.', file: 'src/index.ts' }],
  },
  {
    name: '@fluxerjs/builders',
    dir: 'packages/builders',
    entries: [{ subpath: '.', file: 'src/index.ts' }],
  },
  {
    name: '@fluxerjs/core',
    dir: 'packages/fluxer-core',
    entries: [
      { subpath: '.', file: 'src/index.ts' },
      { subpath: './client', file: 'src/subpath-client.ts' },
      { subpath: './errors', file: 'src/subpath-errors.ts' },
      { subpath: './message', file: 'src/subpath-message.ts' },
    ],
  },
];

function collectExports(filePath: string): string[] {
  const text = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  const names = new Set<string>();

  for (const stmt of sf.statements) {
    if (ts.isExportDeclaration(stmt)) {
      if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
        for (const el of stmt.exportClause.elements) {
          names.add(el.name.text);
        }
      }
    } else if (ts.isExportAssignment(stmt)) {
      names.add('default');
    } else {
      const mods = ts.canHaveModifiers(stmt) ? ts.getModifiers(stmt) : undefined;
      const isExport = mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!isExport) continue;
      if (
        ts.isClassDeclaration(stmt) ||
        ts.isFunctionDeclaration(stmt) ||
        ts.isInterfaceDeclaration(stmt) ||
        ts.isTypeAliasDeclaration(stmt) ||
        ts.isEnumDeclaration(stmt)
      ) {
        if (stmt.name) names.add(stmt.name.text);
      } else if (ts.isVariableStatement(stmt)) {
        for (const d of stmt.declarationList.declarations) {
          if (ts.isIdentifier(d.name)) names.add(d.name.text);
        }
      }
    }
  }
  return [...names].sort();
}

function main(): void {
  fs.mkdirSync(outDir, { recursive: true });
  const snapshot: Record<string, { subpath: string; exports: string[] }[]> = {};
  for (const pkg of PACKAGES) {
    const entries = [];
    for (const e of pkg.entries) {
      const file = path.join(root, pkg.dir, e.file);
      if (!fs.existsSync(file)) {
        console.warn(`skip missing ${file}`);
        continue;
      }
      entries.push({ subpath: e.subpath, exports: collectExports(file) });
    }
    snapshot[pkg.name] = entries;
    const safe = pkg.name.replace('@', '').replace('/', '__');
    fs.writeFileSync(
      path.join(outDir, `${safe}.json`),
      JSON.stringify(
        { package: pkg.name, generatedAt: new Date().toISOString(), entries },
        null,
        2,
      ) + '\n',
    );
  }
  fs.writeFileSync(
    path.join(outDir, 'index.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), packages: Object.keys(snapshot) },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Wrote baselines under test-fixtures/api-baseline (${Object.keys(snapshot).length} packages)`,
  );
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
