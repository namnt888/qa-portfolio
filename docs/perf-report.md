# Performance Report (k6)

## Mục tiêu
Xác nhận hệ thống giao dịch chịu được tải bình thường và xác định điểm gãy.

## Mô hình tải
- **Smoke:** 10 VU, 1 iteration — kiểm tra hệ thống sẵn sàng
- **Load:** 50 VU, 5 phút — tải bình thường
- **Stress:** 100 VU, 10 phút — tìm điểm gãy
- **Soak:** 30 VU, 1 giờ — kiểm tra rò rỉ tài nguyên

## Ngưỡng (thresholds)
- p95 < 2000ms
- Error rate < 1%

## Kết quả (mẫu, staging)

| Scenario | VU | Thời gian | p95 | Error rate | Kết quả |
|---|---|---|---|---|---|
| Smoke | 10 | 1 iteration | 850ms | 0% | ✅ Pass |
| Load | 50 | 5 phút | 1200ms | 0.3% | ✅ Pass |
| Stress | 100 | 10 phút | 3500ms | 2.1% | ⚠️ Cần tối ưu |

## Điểm gãy khả năng
- API tạo giao dịch chậm hơn 2s khi cùng lúc > 80 request
- Kết nối Supabase pooler đạt giới hạn ở khoảng 90 VU đồng thời

## Khuyến nghị
- Tăng Supabase connection pool
- Thêm rate limiter cho API tạo giao dịch
- Cache danh sách account/category
