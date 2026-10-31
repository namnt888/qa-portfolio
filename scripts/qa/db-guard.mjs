// Fails closed when the suite is pointed at production.
//
// Run by `tests/global-setup.ts` before any browser starts, and available
// directly with `pnpm guard`. Exit code 1 blocks the run.
//
//   QA_ALLOW_PROD=1 pnpm guard   # explicit, logged override

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILE = resolve(process.cwd(), '.env.staging.local');
const MODE = process.argv.includes('--mode=e2e') ? 'e2e' : 'default';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(ENV_FILE);

const allowProd = process.env.QA_ALLOW_PROD === '1';
const target = process.env.E2E_BASE_URL?.trim() ?? '';
const prodBaseUrl = process.env.PROD_BASE_URL?.trim() ?? '';
const prodProjectRef = process.env.PROD_PROJECT_REF?.trim() ?? '';
const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';

const findings = [];

console.log(`db-guard (mode=${MODE}, env=${existsSync(ENV_FILE) ? ENV_FILE : 'none'})`);

if (!target) {
  console.log('[ SKIP ] E2E_BASE_URL is not set — the bundled demo app is the target.');
} else if (prodBaseUrl) {
  const hostOf = (value) => {
    try {
      return new URL(value).host;
    } catch {
      return value;
    }
  };
  if (hostOf(target) === hostOf(prodBaseUrl)) {
    findings.push(`E2E_BASE_URL: host "${hostOf(target)}" is PRODUCTION.`);
  } else {
    console.log(`[ PASS ] E2E_BASE_URL: "${hostOf(target)}" is not the production host.`);
  }
} else {
  console.log('[ SKIP ] PROD_BASE_URL is not configured — no host comparison possible.');
}

if (!prodProjectRef) {
  console.log('[ SKIP ] PROD_PROJECT_REF is not configured — no project comparison possible.');
} else if (supabaseUrl.includes(prodProjectRef) || target.includes(prodProjectRef)) {
  findings.push(`project ref "${prodProjectRef}" is PRODUCTION.`);
} else {
  console.log('[ PASS ] PROD_PROJECT_REF: target does not match the production project.');
}

if (findings.length === 0) {
  console.log('db-guard: pass');
  process.exit(0);
}

for (const finding of findings) console.log(`[ FAIL ] ${finding}`);

if (allowProd) {
  console.log('QA_ALLOW_PROD=1 — continuing against production. This writes real data.');
  process.exit(0);
}

console.log('Blocked by db-guard. Set QA_ALLOW_PROD=1 only if writing production data is intended.');
process.exit(1);
