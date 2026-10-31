# Security

## Secrets

This repository contains **no credentials of any kind**. Everything in `demo/` is
synthetic: one shared passcode (`demo-passcode`, overridable by `DEMO_PASSCODE`) and an
in-memory store that resets on restart.

Rules this repository follows:

- Only `*.example` env files are committed. `.env*` real files are gitignored.
- No service-role keys, project refs, tokens or personal data appear in source, docs,
  tests or workflow files.
- The test suite reads its passcode from `E2E_PASSCODE` and throws when it is missing on a
  real target, instead of falling back to a literal in a spec file.
- CI reads secrets from the repository's secret store; a workflow that needs one is gated
  on it being configured.

If you find a committed secret in this repository, treat it as leaked: deleting the line
does not remove it from history, and the value must be rotated.

## Running against a real environment

- Point the suite at a **disposable** environment. `E2E_BASE_URL` is required for a real
  target; there is no production default.
- Arm the guard by setting `PROD_BASE_URL` and `PROD_PROJECT_REF`. `scripts/qa/db-guard.mjs`
  then fails the run before a browser starts.
- `QA_ALLOW_PROD=1` is the only override, and it logs what it is about to do.

## Reporting

Open a GitHub issue for anything in this repository. Do not include live credentials,
tokens or personal data in the report; describe the location and the kind of value instead.
