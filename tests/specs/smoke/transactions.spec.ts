import { expect, test } from '@playwright/test';
import { TransactionsPage } from '../../pages/TransactionsPage';

const SEEDED_IDS = ['TX-1001', 'TX-1002', 'TX-1003', 'TX-1004'];

test.describe('transactions ledger', () => {
  test('renders every seeded transaction after sign-in', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    for (const id of SEEDED_IDS) {
      await expect(txns.rows.filter({ hasText: id })).toBeVisible();
    }
    // Amounts are locale-formatted, never raw floats.
    await expect(txns.balance).toHaveText(/^-?[\d,]+(\.\d+)? ₫$/);
  });

  test('filters the ledger down to expenses', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    await txns.filterBy('expense');

    const types = await txns.rows.allInnerTexts();
    expect(types.length).toBeGreaterThan(0);
    for (const row of types) {
      expect(row).toContain('expense');
      expect(row).not.toContain('income');
    }
  });
});
