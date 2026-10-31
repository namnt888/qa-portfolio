# QA Portfolio — Playwright + TypeScript

A runnable QA portfolio: test plan, test cases, API contract tests, BDD scenarios, a
page-object Playwright suite, and CI that produces an HTML report.

Everything here runs against a **small demo app bundled in `demo/`** — an in-memory ledger
with passcode sign-in. That choice is deliberate: a portfolio you cannot run is a
screenshot. Clone this repository, run one command, and every claim below is checked in
front of you.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test          # one command, ~30 tests, HTML report
```

## What this demonstrates

| Area | Where | Why it is here |
|---|---|---|
| Test plan with risk ranking | [`docs/test-plan.md`](docs/test-plan.md) | Shows what was excluded and why, not just what was tested |
| Test cases + traceability | [`docs/test-cases.md`](docs/test-cases.md) | 30 cases mapped to the spec that proves each one |
| API contract matrix | [`docs/api-test-matrix.md`](docs/api-test-matrix.md) | Status codes, field-level validation, idempotency |
| Bug reports | [`docs/bug-reports/`](docs/bug-reports/) | Two real defects in the demo app, plus the template |
| UI smoke + regression | `tests/specs/smoke`, `tests/specs/regression` | Page objects, web-first assertions, no `waitForTimeout` |
| API tests | `tests/specs/api` | Auth, validation, delete semantics, retry safety |
| Non-functional | `tests/specs/nonfunctional` | 412px layout, accessible names, table semantics |
| BDD | `tests/features` | Two scenarios in Gherkin, real step definitions |
| Seeded session | `tests/auth.setup.ts` | Log in once, reuse `storageState` across specs |
| Production guard | `scripts/qa/db-guard.mjs` | Fails before a browser opens if the target is production |
| CI | `.github/workflows` | Typecheck, suite, BDD, report artifact |

## Layout

```
demo/                     # the system under test (bundled, in-memory, synthetic data)
  server.mjs              #   node:http API + static files
  public/                 #   the UI, plain DOM, no build step
tests/
  env.ts                  # base URL + passcode resolution; never defaults to production
  global-setup.ts         # runs db-guard before any browser starts
  auth.setup.ts           # one sign-in, saved as storageState
  pages/                  # page objects
  data/                   # payload builders, unique-value helpers
  api/                    # API client wrapper
  specs/{smoke,regression,api,nonfunctional}/
  features/               # .feature files + step definitions
docs/                     # test plan, cases, API matrix, bug reports
perf/                     # optional k6 script (not run in CI)
scripts/qa/db-guard.mjs   # fail-closed production guard
```

## Commands

| Command | What it does |
|---|---|
| `pnpm test` | Full suite; starts the demo app automatically |
| `pnpm test:smoke` | Sign-in, ledger render, filter — the fast gate |
| `pnpm test:regression` | Input handling, formatting, rendering safety, session |
| `pnpm test:api` | Contract tests, no browser |
| `pnpm test:nonfunctional` | Mobile viewport + accessibility |
| `pnpm bdd:test` | Generate and run the Gherkin scenarios |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test:report` | Open the last HTML report |
| `pnpm demo` | Run the demo app on its own (`127.0.0.1:4173`) |
| `pnpm guard` | Run the production guard by hand |

## Pointing the suite at your own environment

```bash
cp .env.staging.example .env.staging.local
# set E2E_BASE_URL and E2E_PASSCODE, plus PROD_BASE_URL / PROD_PROJECT_REF to arm the guard
pnpm test
```

`E2E_BASE_URL` unset means the bundled demo app. There is no fallback to a deployed host:
a default that points at production is how a suite starts writing real data.

## Design decisions worth a question

**The passcode comes from the environment, not a spec file.** A credential committed to a
test suite is a leaked credential the moment the repository is forked, and git history does
not forget. `tests/env.ts` throws when `E2E_PASSCODE` is missing on a real target rather
than guessing a default.

**The guard is fail-closed and logs its override.** `db-guard` compares the target against
`PROD_BASE_URL` / `PROD_PROJECT_REF` and exits non-zero before Playwright launches. The
escape hatch (`QA_ALLOW_PROD=1`) prints what it is about to do, so an override is visible in
CI logs instead of silent.

**Assertions are on user-visible state, never on timing.** No `waitForTimeout`; the suite
waits for the row, the error message or the URL. The one time-based check in `docs/` is a
p95 budget in the k6 script, which is a performance test, not a functional one.

**The demo app knows it is a demo.** It is in-memory, seeded, and exposes `/api/_reset` to
the tests. That keeps the suite deterministic without mocking the network — the tests
exercise real HTTP and a real DOM, only a small server.

## Scope

The app under test in `demo/` is synthetic and intentionally small. Client work — the
systems, the defect history, the dashboards — is confidential and is not reproduced here.
This repository is the part that can be shown.
