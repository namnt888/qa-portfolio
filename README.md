# QA Portfolio

Hệ thống test để chứng minh kỹ năng QA Automation (40% automation / 60% manual), xây dựng trên
**[money-gemini](https://github.com/namnt888/money-gemini)** — một ứng dụng quản lý tài chính cá nhân
thực tế (Next.js 16 + Supabase) làm system-under-test.

> ⚠️ **Repo này không chứa data thật, passcode, hay project ref production.** Mọi số liệu và tên
> người đều là synthetic (giả lập). Repo money-gemini gốc không được public vì chứa dữ liệu tài
> chính cá nhân thật.

## Cấu trúc

```
docs/
  test-plan.md           # Test plan 1 trang + risk analysis
  test-cases.md          # 40+ test cases + traceability matrix
  bug-reports/           # 5 bug report đã sanitize
  perf-report.md         # Kết quả load test (k6)
tests/
  smoke/                 # @smoke, chạy mỗi PR (< 2 phút)
  regression/            # Full E2E, chạy staging/nightly
  api/                   # API test không cần browser
perf/                    # k6 scripts (smoke → load → stress → soak)
.github/workflows/       # PR gate + E2E staging + publish HTML report
demo/                    # Link Vercel preview + Supabase staging (seed synthetic)
```

## Kiến trúc test

| Tầng | Mục đích | Dữ liệu | Chạy trên |
|---|---|---|---|
| Local | Vòng lặp viết code | DB staging | Máy cá nhân |
| Staging | Xác nhận trước merge | DB staging + seed | CI (nightly + PR) |
| Prod (chỉ đọc) | Smoke sau deploy | DB prod, chỉ GET | CI sau release |

`db-guard` chặn mọi test ghi vào production. Xem chi tiết tại
[TEST-ARCHITECTURE.md trong money-gemini](https://github.com/namnt888/money-gemini/blob/main/docs/qa/TEST-ARCHITECTURE.md).

## Cách chạy

```bash
# PR gate
pnpm lint && pnpm test

# E2E staging (cần .env.staging.local)
node scripts/qa/seed.mjs --scenario=transactions
pnpm test:e2e
node scripts/qa/cleanup.mjs --run-id=<run-id>

# Performance (chỉ trên staging)
k6 run perf/smoke.js
```

## Portfolio artifacts

Tất cả artifacts trong `docs/` đã được sanitize: không tên người thật, không số tiền thật,
không project ref, không passcode. Có thể xuất bản ngay để recruiter xem.
