import { expect, test } from '@playwright/test';
import { TransactionsPage } from '../../pages/TransactionsPage';

// Runs on the `nonfunctional` project, which uses a Pixel 7 viewport.
test.describe('responsive layout', () => {
  test('does not scroll horizontally at 412px', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('keeps the ledger usable with the virtual keyboard open', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    await txns.amountInput.focus();
    await expect(txns.amountInput).toBeFocused();

    await txns.noteInput.fill('mobile note');
    await txns.addButton.scrollIntoViewIfNeeded();
    await expect(txns.addButton).toBeInViewport();
  });
});
