import { execFileSync } from 'node:child_process';

export default function globalSetup(): void {
  execFileSync(process.execPath, ['scripts/qa/db-guard.mjs', '--mode=e2e'], {
    stdio: 'inherit',
  });
}
