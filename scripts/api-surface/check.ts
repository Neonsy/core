/**
 * Diff current public export surface against committed baselines.
 * Failures: removed export names (breaking). Additions are allowed and logged.
 */
import fs from 'node:fs';
import { baselineDir, computeSnapshot, packageBaselineFile, type SurfaceEntry } from './shared.js';

function loadBaseline(packageName: string): SurfaceEntry[] | null {
  const file = packageBaselineFile(packageName);
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    entries: SurfaceEntry[];
  };
  return raw.entries;
}

function main(): void {
  if (!fs.existsSync(baselineDir)) {
    throw new Error(
      `Missing ${baselineDir}. Run \`pnpm run snapshot:exports\` to create baselines.`,
    );
  }

  const current = computeSnapshot();
  const removals: string[] = [];
  const additions: string[] = [];

  for (const [pkgName, currentEntries] of Object.entries(current) as Array<
    [string, SurfaceEntry[]]
  >) {
    const baselineEntries = loadBaseline(pkgName);
    if (!baselineEntries) {
      removals.push(`${pkgName}: missing baseline file (run snapshot:exports)`);
      continue;
    }

    for (const entry of currentEntries) {
      const base = baselineEntries.find((e) => e.subpath === entry.subpath);
      if (!base) {
        additions.push(
          `${pkgName} ${entry.subpath}: new subpath (+${entry.exports.length} exports)`,
        );
        continue;
      }
      const baseSet = new Set(base.exports);
      const curSet = new Set(entry.exports);
      for (const name of base.exports) {
        if (!curSet.has(name)) {
          removals.push(`${pkgName} ${entry.subpath}: removed ${name}`);
        }
      }
      for (const name of entry.exports) {
        if (!baseSet.has(name)) {
          additions.push(`${pkgName} ${entry.subpath}: added ${name}`);
        }
      }
    }

    for (const base of baselineEntries) {
      if (!currentEntries.some((e) => e.subpath === base.subpath)) {
        for (const name of base.exports) {
          removals.push(`${pkgName} ${base.subpath}: removed ${name} (subpath gone)`);
        }
      }
    }
  }

  // Packages that disappeared entirely from the snapshot config
  const indexPath = `${baselineDir}/index.json`;
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as { packages: string[] };
    for (const pkg of index.packages) {
      if (!(pkg in current)) {
        removals.push(`${pkg}: package missing from surface config`);
      }
    }
  }

  if (additions.length) {
    console.log('api-surface:check — additions (ok):');
    for (const a of additions) console.log(`  + ${a}`);
  }

  if (removals.length) {
    console.error('api-surface:check — breaking removals:');
    for (const r of removals) console.error(`  - ${r}`);
    console.error(
      '\nIf intentional, update baselines with `pnpm run snapshot:exports` and include the diff.',
    );
    process.exit(1);
  }

  console.log('api-surface:check — no export removals');
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
