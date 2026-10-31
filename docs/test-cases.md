# Test Cases — Ledger

Every case below is written against the bundled demo app. `Automated in` names the
spec that proves it, or `manual` when a human has to look. A case marked `manual`
is not a gap in the suite so much as a decision that the check does not pay for
itself as code.

Techniques are named so the reasoning is visible: **EP** equivalence partitioning,
**BVA** boundary value analysis, **DT** decision table, **ST** state transition,
**EG** error guessing.

## Functional

| ID | Area | Case | Technique | Priority | Automated in |
|---|---|---|---|---|---|
| TC-01 | Sign-in | Correct passcode opens the ledger | EP | P1 | `smoke/login.spec.ts` |
| TC-02 | Sign-in | Wrong passcode shows an inline error and stays on the form | EP | P1 | `smoke/login.spec.ts` |
| TC-03 | Sign-in | Empty passcode is refused by the API | BVA | P2 | `api/transactions.api.spec.ts` |
| TC-04 | Session | Sign-out returns to the passcode form | ST | P2 | `regression/transactions.spec.ts` |
| TC-05 | Ledger | All seeded rows render after sign-in | — | P1 | `smoke/transactions.spec.ts` |
| TC-06 | Ledger | Balance is formatted as currency, never a raw float | EP | P1 | `smoke/transactions.spec.ts` |
| TC-07 | Ledger | Filter `expense` shows expenses and no income | DT | P1 | `smoke/transactions.spec.ts` |
| TC-08 | Ledger | Filter `income` shows income and no expenses | DT | P1 | `api/transactions.api.spec.ts`, `features/ledger.feature` |
| TC-09 | Ledger | Empty ledger shows the empty state instead of a blank table | EG | P2 | manual |
| TC-10 | Create | Valid expense appears at the top with a formatted amount | — | P1 | `regression/transactions.spec.ts` |
| TC-11 | Create | Form clears after a successful save | — | P2 | `regression/transactions.spec.ts` |
| TC-12 | Create | Amount `0` is refused with a field message | BVA | P1 | `regression/transactions.spec.ts` |
| TC-13 | Create | Negative amount is refused by the API | BVA | P1 | `api/transactions.api.spec.ts` |
| TC-14 | Create | Non-numeric amount is refused before the request | EP | P2 | `regression/transactions.spec.ts` |
| TC-15 | Create | Three decimal places are refused | BVA | P2 | `api/transactions.api.spec.ts` |
| TC-16 | Create | Note longer than 120 characters is refused | BVA | P2 | `api/transactions.api.spec.ts` |
| TC-17 | Create | Unknown `type` is refused | EP | P2 | `api/transactions.api.spec.ts` |
| TC-18 | Create | A repeated `Idempotency-Key` returns `409`, not a second row | EG | P1 | `api/transactions.api.spec.ts` |
| TC-19 | Create | Two concurrent submits with the same key create one row | EG | P1 | manual (see note) |
| TC-20 | Rendering | A note containing markup renders as text | EG | P1 | `regression/transactions.spec.ts` |
| TC-21 | API | Reading the ledger without a token returns `401` | — | P1 | `api/transactions.api.spec.ts` |
| TC-22 | API | Deleting an unknown id returns `404`; deleting twice returns `404` the second time | ST | P2 | `api/transactions.api.spec.ts` |

**TC-19 note.** The automated case covers a *sequential* retry. True concurrency
needs a barrier so both requests are in flight at once; that is written up as a
manual/exploratory case rather than faked with `Promise.all`, which does not
guarantee overlap on a single-threaded server.

## Non-functional

| ID | Area | Case | Technique | Priority | Automated in |
|---|---|---|---|---|---|
| TC-23 | Responsive | No horizontal scrolling at 412px | — | P2 | `nonfunctional/responsive.spec.ts` |
| TC-24 | Responsive | Primary action stays in the viewport with the keyboard open | EG | P2 | `nonfunctional/responsive.spec.ts` |
| TC-25 | Accessibility | Every form control has an accessible name | — | P1 | `nonfunctional/accessibility.spec.ts` |
| TC-26 | Accessibility | The table exposes four column headers | — | P2 | `nonfunctional/accessibility.spec.ts` |
| TC-27 | Accessibility | Validation errors are announced as alerts | — | P2 | `nonfunctional/accessibility.spec.ts` |
| TC-28 | Performance | Ledger response p95 stays under 2000 ms at 50 VUs | — | P3 | `perf/smoke.js` (manual) |
| TC-29 | Compatibility | Ledger renders correctly in Chromium, Firefox and WebKit | — | P3 | manual |
| TC-30 | Localisation | Amounts stay unambiguous with a vi-VN locale | EG | P2 | manual — see `bug-reports/BUG-002` |

## Traceability summary

| Requirement | Cases |
|---|---|
| Unauthenticated users cannot see the ledger | TC-02, TC-03, TC-21 |
| The ledger reflects recorded transactions | TC-05, TC-10, TC-11, TC-18 |
| Invalid input never creates a row | TC-12–TC-17 |
| User content is rendered safely | TC-20 |
| The ledger is usable on a phone and with a screen reader | TC-23–TC-27 |
