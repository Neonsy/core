/**
 * Fail if any relative import under packages src trees uses a path segment whose
 * casing does not match the on-disk directory/file (macOS case-insensitive traps).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packagesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../packages');

const importRe = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '_generated') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else if (ent.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function resolveSpec(importer: string, spec: string): string {
  const withoutJs = spec.replace(/\.js$/, '');
  return path.normalize(path.join(path.dirname(importer), withoutJs));
}

function casingMatchesDisk(absPathNoExt: string): boolean {
  const candidates = [`${absPathNoExt}.ts`, absPathNoExt];
  for (const candidate of candidates) {
    const parts = candidate.split(path.sep);
    let cur = '/';
    const start = 1;
    for (let i = start; i < parts.length; i++) {
      const want = parts[i];
      if (!fs.existsSync(cur)) return false;
      const names = fs.readdirSync(cur);
      const hit = names.find((n) => n === want);
      if (!hit) return false;
      cur = path.join(cur, hit);
    }
    if (fs.existsSync(cur) || fs.existsSync(`${cur}.ts`)) return true;
  }
  return false;
}

function packageSrcRoots(): string[] {
  return fs
    .readdirSync(packagesRoot, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => path.join(packagesRoot, ent.name, 'src'))
    .filter((src) => fs.existsSync(src));
}

function main(): void {
  const errors: string[] = [];
  for (const root of packageSrcRoots()) {
    const pkgLabel = path.relative(packagesRoot, path.dirname(root));
    for (const file of walk(root)) {
      const text = fs.readFileSync(file, 'utf8');
      importRe.lastIndex = 0;
      for (const m of text.matchAll(importRe)) {
        const spec = m[1];
        if (!spec?.startsWith('.')) continue;
        const checkPath = resolveSpec(file, spec);
        if (!casingMatchesDisk(checkPath) && !casingMatchesDisk(path.join(checkPath, 'index'))) {
          const parent = path.dirname(checkPath);
          const base = path.basename(checkPath);
          if (fs.existsSync(parent)) {
            const names = fs.readdirSync(parent);
            const ci = names.find(
              (n) =>
                n.toLowerCase() === base.toLowerCase() ||
                n.toLowerCase() === `${base.toLowerCase()}.ts`,
            );
            if (ci && ci !== base && ci !== `${base}.ts`) {
              errors.push(
                `${pkgLabel}/${path.relative(root, file)}: import '${spec}' casing mismatch (disk has '${ci}')`,
              );
            }
          }
        }
      }
    }
  }

  if (errors.length) {
    console.error('import casing check failed:');
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log('import casing check — ok');
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
