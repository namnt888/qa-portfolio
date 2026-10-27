# Test Cases — Giao dịch tài chính (40+ case)

Dưới đây là danh sách test case mẫu, đã sanitize (không tên người thật, không số tiền thật).
Mỗi case có ID, mức ưu tiên, và liên kết đến requirement.

## Traceability matrix

| TC ID | Requirement | Loại | Ưu tiên | Automation |
|---|---|---|---|---|
| TC-01 | Tạo giao dịch chi thành công | Functional | P1 | ✅ |
| TC-02 | Tạo giao dịch thu thành công | Functional | P1 | ✅ |
| TC-03 | Giao dịch 0 đồng | Boundary | P2 | ✅ |
| TC-04 | Giao dịch giá trị max | Boundary | P2 | ✅ |
| TC-05 | Nhập notes trống | Negative | P2 | ✅ |
| TC-06 | Chọn account không tồn tại | Negative | P2 | ✅ |
| TC-07 | Cashback 8% share tính đúng | Functional | P1 | ✅ |
| TC-08 | Cashback min_spend chưa đạt | Boundary | P2 | ✅ |
| TC-09 | Cashback cap đạt ngưỡng | Boundary | P2 | ✅ |
| TC-10 | waiting_refund không lên sheet | Functional | P1 | ✅ |
| TC-11 | Công nợ lent + borrowed | Functional | P1 | ✅ |
| TC-12 | Rollover công nợ sang cycle mới | Functional | P2 | ✅ |
| TC-13 | Đối soát 2 chiều DB ↔ Sheet | Functional | P1 | ✅ |
| TC-14 | Cột K recon trắng thì xóa DB recon | Negative | P2 | ✅ |
| TC-15 | Đăng nhập đúng passcode | Functional | P1 | ✅ |
| TC-16 | Đăng nhập sai passcode | Negative | P1 | ✅ |
| TC-17 | Session hết hạn | Negative | P2 | ✅ |
| TC-18 | Export sheet thành công | Functional | P2 | ✅ |
| TC-19 | Export sheet thất bại (mất mạng) | Negative | P2 | ✅ |
| TC-20 | Batch transfer nhiều giao dịch | Functional | P2 | ✅ |

... (tổng cộng 40+ case, xem chi tiết trong `docs/test-cases.md` của money-gemini)

## Mẫu chi tiết một case

### TC-03: Giao dịch 0 đồng
- **Mục đích:** Xác nhận hệ thống chấp nhận giao dịch giá trị 0 (ví dụ: giao dịch khuyến mãi miễn phí).
- **Bước thực hiện:**
  1. Mở trang giao dịch
  2. Nhập số tiền: 0
  3. Chọn account, category
  4. Nhấn "Thêm giao dịch"
- **Kết quả mong đợi:** Giao dịch được tạo thành công, hiển thị trong bảng với số tiền 0.
- **Kết quả thực tế:** (điền khi chạy)
- **Trạng thái:** Pass / Fail / Blocked
