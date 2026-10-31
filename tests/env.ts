import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

const ENV_FILE = resolve(process.cwd(), '.env.staging.local');
if (existsSync(ENV_FILE)) config({ path: ENV_FILE, quiet: true });

export const DEMO_PORT = Number(process.env.DEMO_PORT ?? 4173);
export const DEMO_BASE_URL = `http://127.0.0.1:${DEMO_PORT}`;
export const DEMO_PASSCODE = 'demo-passcode';

/** No E2E_BASE_URL means the suite runs against the bundled demo app. */
export function isDemoTarget(): boolean {
  return !process.env.E2E_BASE_URL?.trim();
}

/**
 * `E2E_BASE_URL` wins, then the bundled demo app. Never defaults to a deployed
 * host: a default that points at production is how a test suite starts writing
 * real data.
 */
export function resolveBaseUrl(): string {
  const target = process.env.E2E_BASE_URL?.trim();
  return target ? target.replace(/\/+$/, '') : DEMO_BASE_URL;
}

/**
 * The suite logs in with the app passcode, which must be supplied rather than
 * guessed — a hardcoded passcode in `tests/` is a leaked credential the moment
 * the repository is forked.
 */
export function requirePasscode(): string {
  const passcode = process.env.E2E_PASSCODE?.trim();
  if (passcode) return passcode;
  if (isDemoTarget()) return DEMO_PASSCODE;
  throw new Error(
    [
      'E2E_PASSCODE is not set.',
      '',
      'The suite logs in with the app passcode. Set E2E_PASSCODE in .env.staging.local',
      '(copy .env.staging.example) or expose it as a CI secret.',
      'Do not put the value back into a spec file.',
    ].join('\n')
  );
}
