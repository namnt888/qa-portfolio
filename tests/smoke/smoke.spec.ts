# Smoke Test (Playwright)

Kiểm tra luồng quan trọng nhất: đăng nhập, xem danh sách giao dịch, thêm giao dịch đơn giản.

```typescript
import { test, expect } from '@playwright/test';

test('smoke: login and view transactions', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input#passcode', process.env.E2E_PASSCODE!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/transactions');

  await expect(page.locator('table')).toBeVisible();
  await expect(page.locator('text=No transactions')).not.toBeVisible();
});
```

Chạy: `pnpm test:e2e --project=smoke`
