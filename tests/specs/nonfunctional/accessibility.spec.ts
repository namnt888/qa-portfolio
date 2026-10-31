import { expect, test } from '@playwright/test';
import { TransactionsPage } from '../../pages/TransactionsPage';

test.describe('accessibility basics', () => {
  test('every form control has an accessible name', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    const controls = page.locator('input:visible, select:visible');
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(controls.nth(index)).toHaveAccessibleName(/\S+/);
    }
  });

  test('the ledger exposes column headers to assistive tech', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveCount(4);
  });

  test('validation failures are announced as alerts', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    await txns.add({ type: 'expense', amount: 0 });

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveRole('alert');
  });
});
