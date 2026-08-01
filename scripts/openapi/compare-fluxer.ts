/**
 * Diff vendored OpenAPI against a local Fluxer checkout (or OPENAPI_COMPARE_PATH).
 *
 * Usage:
 *   FLUXER_REPO=/path/to/fluxer pnpm exec tsx scripts/openapi/compare-fluxer.ts
 *   pnpm exec tsx scripts/openapi/compare-fluxer.ts --strict
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { OPENAPI_FILE, REPO_ROOT } from './paths.js';

const strict = process.argv.includes('--strict');

function defaultFluxerOpenApi(): string | null {
  const env = process.env.OPENAPI_COMPARE_PATH ?? process.env.FLUXER_REPO;
  if (env) {
    const candidate = env.endsWith('.json')
      ? env
      : path.join(env, 'fluxer_api/src/api/openapi/openapi.json');
    if (fs.existsSync(candidate)) return candidate;
  }
  const sibling = path.resolve(REPO_ROOT, '../fluxer/fluxer_api/src/api/openapi/openapi.json');
  if (fs.existsSync(sibling)) return sibling;
  return null;
}

function sha256(buf: Buffer | string): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function main(): void {
  const comparePath = defaultFluxerOpenApi();
  if (!comparePath) {
    console.error(
      'No Fluxer OpenAPI found. Set FLUXER_REPO or OPENAPI_COMPARE_PATH, or place fluxer next to this repo.',
    );
    process.exitCode = strict ? 1 : 0;
    return;
  }

  const vendor = fs.readFileSync(OPENAPI_FILE);
  const other = fs.readFileSync(comparePath);
  const vendorDoc = JSON.parse(vendor.toString('utf8')) as {
    paths?: Record<string, unknown>;
    components?: { schemas?: Record<string, unknown> };
  };
  const otherDoc = JSON.parse(other.toString('utf8')) as {
    paths?: Record<string, unknown>;
    components?: { schemas?: Record<string, unknown> };
  };

  const vp = new Set(Object.keys(vendorDoc.paths ?? {}));
  const op = new Set(Object.keys(otherDoc.paths ?? {}));
  const vs = new Set(Object.keys(vendorDoc.components?.schemas ?? {}));
  const os = new Set(Object.keys(otherDoc.components?.schemas ?? {}));

  const pathOnlyVendor = [...vp].filter((p) => !op.has(p)).sort();
  const pathOnlyOther = [...op].filter((p) => !vp.has(p)).sort();
  const schemaOnlyVendor = [...vs].filter((s) => !os.has(s)).sort();
  const schemaOnlyOther = [...os].filter((s) => !vs.has(s)).sort();

  const schemaContentDiffs: string[] = [];
  for (const name of [...vs].filter((s) => os.has(s)).sort()) {
    const ca = JSON.stringify(vendorDoc.components!.schemas![name]);
    const cb = JSON.stringify(otherDoc.components!.schemas![name]);
    if (ca !== cb) schemaContentDiffs.push(name);
  }

  const identical = sha256(vendor) === sha256(other);
  console.log(`Vendor:  ${OPENAPI_FILE}`);
  console.log(`Compare: ${comparePath}`);
  console.log(`SHA match: ${identical}`);
  console.log(
    `Paths only in vendor (${pathOnlyVendor.length}): ${pathOnlyVendor.slice(0, 10).join(', ') || '—'}`,
  );
  console.log(
    `Paths only in fluxer (${pathOnlyOther.length}): ${pathOnlyOther.slice(0, 10).join(', ') || '—'}`,
  );
  console.log(
    `Schemas only in vendor (${schemaOnlyVendor.length}): ${schemaOnlyVendor.slice(0, 10).join(', ') || '—'}`,
  );
  console.log(
    `Schemas only in fluxer (${schemaOnlyOther.length}): ${schemaOnlyOther.slice(0, 10).join(', ') || '—'}`,
  );
  console.log(
    `Schema content diffs (${schemaContentDiffs.length}): ${schemaContentDiffs.slice(0, 20).join(', ') || '—'}`,
  );

  const drifted =
    !identical ||
    pathOnlyVendor.length +
      pathOnlyOther.length +
      schemaOnlyVendor.length +
      schemaOnlyOther.length +
      schemaContentDiffs.length >
      0;

  if (strict && drifted) {
    console.error('\nOpenAPI drift detected vs Fluxer checkout.');
    process.exitCode = 1;
  } else if (!drifted) {
    console.log('\nOpenAPI compare: ok (in sync)');
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
