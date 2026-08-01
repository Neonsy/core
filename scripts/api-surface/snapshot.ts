/**
 * Snapshot public export names from package entry sources into test-fixtures/api-baseline.
 * Run intentionally when adding public exports: `pnpm run snapshot:exports`
 */
import { computeSnapshot, writeSnapshot } from './shared.js';

try {
  const snapshot = computeSnapshot();
  writeSnapshot(snapshot);
  console.log(
    `Wrote baselines under test-fixtures/api-baseline (${Object.keys(snapshot).length} packages)`,
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}
