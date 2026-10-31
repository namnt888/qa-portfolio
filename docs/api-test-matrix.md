# API Test Matrix

Target: the bundled demo API in `demo/server.mjs`. Contract tests live in
`tests/specs/api/transactions.api.spec.ts`.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/login` | none | Exchange a passcode for a bearer token |
| GET | `/api/transactions` | bearer | List transactions, optionally `?type=income\|expense` |
| POST | `/api/transactions` | bearer | Create a transaction; honours `Idempotency-Key` |
| DELETE | `/api/transactions/:id` | bearer | Remove a transaction |
| GET | `/health` | none | Readiness probe used by the test runner |
| POST | `/api/_reset` | header `x-demo-reset: 1` | Restore the seed (demo only) |

## Matrix

| # | Endpoint | Case | Expected | Asserted |
|---|---|---|---|---|
| 1 | POST `/api/login` | Valid passcode | `200` + `{ token }` | body |
| 2 | POST `/api/login` | Wrong passcode | `401` + `invalid_passcode` | status, body |
| 3 | POST `/api/login` | Missing passcode | `400` + `field: passcode` | status, body |
| 4 | GET `/api/transactions` | No `Authorization` | `401` | status |
| 5 | GET `/api/transactions` | Valid token | `200`, `total === items.length` | status, body |
| 6 | GET `/api/transactions?type=income` | Valid filter | `200`, every item `income` | body |
| 7 | GET `/api/transactions?type=transfer` | Unknown filter | `400` + `field: type` | status, body |
| 8 | POST `/api/transactions` | Valid body | `201`, `Location: /api/transactions/{id}` | status, headers, body |
| 9 | POST `/api/transactions` | `amount: 0` | `400` + `field: amount` | status, body |
| 10 | POST `/api/transactions` | `amount: -100` | `400` + `field: amount` | status, body |
| 11 | POST `/api/transactions` | `amount: "100"` | `400` + `field: amount` | status, body |
| 12 | POST `/api/transactions` | `amount: 1.005` | `400` + `field: amount` | status, body |
| 13 | POST `/api/transactions` | `type: "transfer"` | `400` + `field: type` | status, body |
| 14 | POST `/api/transactions` | 121-character note | `400` + `field: note` | status, body |
| 15 | POST `/api/transactions` | Reused `Idempotency-Key` | `409` + original `id` | status, body |
| 16 | DELETE `/api/transactions/:id` | Existing id | `204`, no body | status |
| 17 | DELETE `/api/transactions/:id` | Unknown id | `404` + `not_found` | status, body |
| 18 | DELETE `/api/transactions/:id` | Same id twice | `204` then `404` | status |

## Conventions this suite relies on

- **Status codes carry meaning.** `400` is "your body is wrong", `401` is "who are you",
  `404` is "that id is not here", `409` is "you already did this". A client can branch on
  the status without parsing prose.
- **Validation errors name the field.** `field` lets a form highlight one input instead
  of showing a generic banner — and it lets a test assert *which* rule fired rather than
  only that something failed.
- **Idempotency is a header, not a query parameter.** Repeating a request with the same
  key returns `409` and the id of the row that already exists, so a retry after a timeout
  cannot double-post.
