# Test Plan — Hệ thống thanh toán / giao dịch tài chính

## 1. Mục đích
Xác định phạm vi và chiến lược test cho luồng "ghi giao dịch" của hệ thống quản lý tài chính cá nhân
(money-gemini): tạo, sửa, xóa giao dịch, đồng bộ lên Google Sheet, tính cashback, quản lý công nợ.

## 2. Phạm vi
**Trong phạm vi:**
- Giao dịch thu chi qua Quick Add
- Đồng bộ giao dịch lên Google Sheet (is_sync_sheet)
- Tính cashback (share percent / fixed amount)
- Công nợ người vay (lent / borrowed / repayment)
- Đối soát sao kê (recon cột K)

**Ngoài phạm vi (lý do):**
- Giao diện hình ảnh thẻ ngân hàng (cần thiết kế UI riêng, không liên quan logic test)
- Gửi email thông báo (dịch vụ bên thứ 3, không kiểm soát được)
- App mobile (chỉ có web)

## 3. Rủi ro (xếp hạng = xác suất × thiệt hại)

| # | Rủi ro | Xác suất | Thiệt hại | Điểm |
|---|---|---|---|---|
| 1 | Ghi sai số tiền vào sổ tài chính | Cao | Sai sổ, mất niềm tin | 9 |
| 2 | Tính cashback sai 1 đồng | Cao | Sai số dư dự kiến | 8 |
| 3 | Công nợ người vay sai kỳ | Trung bình | Đòi nợ sai người | 7 |
| 4 | Đối soát sheet ghi đè mất ghi chú | Trung bình | Mất dữ liệu đối soát | 6 |
| 5 | Đăng nhập sai passcode | Thấp | Không vào được app | 3 |

## 4. Chiến lược
- **Manual:** exploratory testing cho luồng mới, kiểm tra cảm nhận UI
- **Automation:** regression cho giao dịch, cashback, công nợ (lặp lại, ổn định)
- **Không automation:** giao diện hình ảnh, email thông báo (phụ thuộc bên thứ 3)

## 5. Môi trường & dữ liệu
- Môi trường: staging (Supabase project riêng, không phải production)
- Dữ liệu: seed qua `scripts/qa/seed.mjs`, có run-id, cleanup theo manifest
- Cấm: production (xem `db-guard`)

## 6. Entry / Exit criteria
**Entry:** build xanh, seed chạy được, DB không phải production
**Exit:** hết test case ưu tiên 1-2 pass, 0 bug blocker, flaky rate < 5%

## 7. Deliverable
- `docs/test-cases.md` — 40+ test case + traceability matrix
- `docs/bug-reports/` — 5 bug report đã sanitize
