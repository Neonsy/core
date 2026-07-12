/**
 * Generate TypeScript conformance artifacts from pinned OpenAPI.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(rel: string): void {
  const r = spawnSync('pnpm', ['exec', 'tsx', path.join('scripts', 'openapi', rel)], {
    stdio: 'inherit',
    cwd: root,
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('verify.ts');
run('generate.ts');
run('coverage.ts');
console.log('generate:types complete');
