/**
 * Shared OpenAPI paths for local tooling.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');
export const OPENAPI_DIR = path.join(REPO_ROOT, 'vendor', 'openapi');
export const OPENAPI_FILE = path.join(OPENAPI_DIR, 'fluxer-api.json');
export const MANIFEST_FILE = path.join(OPENAPI_DIR, 'manifest.json');
export const COVERAGE_FILE = path.join(OPENAPI_DIR, 'coverage-report.json');
export const GENERATED_DIR = path.join(REPO_ROOT, 'packages', 'types', 'src', '_generated');
export const OPENAPI_URL = process.env.OPENAPI_URL ?? 'https://api.fluxer.app/openapi.json';
export const EXPECTED_OPENAPI = '3.1.0';
