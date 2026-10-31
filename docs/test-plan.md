# Test Plan — Ledger (demo system under test)

## 1. Purpose

Define scope, risks and strategy for testing the ledger feature set: sign-in, listing
transactions, filtering by type, and recording a transaction.

This plan covers the **bundled demo app** in `demo/`. It is a small, deterministic
target chosen so every claim in this repository can be re-run by anyone who clones
it. It is not a description of a production system.

## 2. Scope

**In scope**

- Passcode sign-in: valid, invalid, missing
- Ledger listing: seeded rows, balance, empty state
- Filtering by `income` / `expense`
- Recording a transaction: valid input, boundary, malformed, idempotent retry
- Rendering safety: notes are displayed as text
- Session handling: sign-out clears the client session
- Non-functional: responsive layout at 412px, form-control accessibility, column semantics
- API contract: auth, validation status codes, delete semantics

**Out of scope (and why)**

| Excluded | Reason |
|---|---|
| Real authentication (OAuth, MFA) | The demo has a single shared passcode by design |
| Persistence across restarts | The store is in-memory; durability would test the store, not the app |
| Payment / third-party integrations | Nothing to integrate against |
| Load and soak testing in CI | A dedicated k6 script exists (`perf/smoke.js`) but is run manually, on a target that can absorb the load |

## 3. Risks

Ranked by probability × impact.

| # | Risk | Probability | Impact | Score | Mitigation |
|---|---|---|---|---|---|
| 1 | A wrong amount is stored and the balance silently drifts | Medium | High | 8 | Boundary and validation cases on `amount`; balance recomputed from rows in the UI |
| 2 | A retried submit creates a duplicate transaction | Medium | High | 8 | `Idempotency-Key` on create; `409` covered by an automated case |
| 3 | Malformed input reaches the database | Medium | Medium | 6 | Server-side validation with field-level `400` responses, tested per field |
| 4 | A note is rendered as markup | Low | High | 6 | Text-node rendering; automated XSS case |
| 5 | The filtered view disagrees with the underlying list | Medium | Medium | 6 | Filter applied server-side; all-rows invariant asserted |
| 6 | The ledger is unusable on a phone | Medium | Medium | 6 | 412px viewport project in CI |
| 7 | An expired session shows stale data instead of the login | Low | Medium | 4 | `401` handling forces sign-out; covered by an API case |

## 4. Strategy

| Layer | What it catches | Where |
|---|---|---|
| Unit / contract (API) | Validation, status codes, auth, idempotency | `tests/specs/api` |
| Smoke (UI) | The app is usable at all: sign-in, list, filter | `tests/specs/smoke` |
| Regression (UI) | Input handling, formatting, rendering safety, session | `tests/specs/regression` |
| Non-functional | Layout at mobile width, accessible names, table semantics | `tests/specs/nonfunctional` |
| BDD | The two flows a product owner would describe in words | `tests/features` |
| Exploratory (manual) | Anything not written down yet — see `docs/test-cases.md` § Manual-only | Manual |

**Functional vs non-functional, as used here:** functional cases ask *does it do the
right thing* (a valid transaction is stored, a zero amount is refused). Non-functional
cases ask *how well does it do it* (usable at 412px, announced to a screen reader,
within a response budget). Both are in scope; only the first group is fully automated.

## 5. Environments and data

| Tier | Target | Data | Writes |
|---|---|---|---|
| Local | Bundled demo app on `127.0.0.1:4173` | Seeded in memory at boot | Yes, discarded on restart |
| CI | Same bundled app | Same seed | Yes, per job |
| Staging (optional) | `E2E_BASE_URL` from `.env.staging.local` | Whatever staging holds | Yes, on a disposable account |
| Production | — | — | **Read-only smoke only, never part of this suite** |

`scripts/qa/db-guard.mjs` runs before any browser starts and fails the run when
`E2E_BASE_URL` matches `PROD_BASE_URL`, or when the target contains
`PROD_PROJECT_REF`. The override is explicit and logged: `QA_ALLOW_PROD=1`.

## 6. Entry and exit criteria

**Entry:** dependencies installed, browser installed, `pnpm typecheck` clean, guard passes.

**Exit:** every P1 case automated and green; zero P1 failures; no test skipped without a
written reason; flaky rate below 2% over the last 20 runs; HTML report attached to the run.

## 7. Deliverables

- `docs/test-cases.md` — cases and traceability to the automated specs
- `docs/api-test-matrix.md` — endpoint × case matrix
- `docs/bug-reports/` — template plus two worked examples filed against the demo app
- `playwright-report/` — HTML report produced by every run
