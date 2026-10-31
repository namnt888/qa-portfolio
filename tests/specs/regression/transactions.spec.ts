import { expect, test } from '@playwright/test';
import { uniqueNote } from '../../data/builders';
import { TransactionsPage } from '../../pages/TransactionsPage';

test.describe('adding a transaction', () => {
  test('shows the new expense with a formatted amount', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    const note = uniqueNote('add');
    await txns.add({ type: 'expense', amount: 123456, note });

    const row = txns.rows.filter({ hasText: note });
    await expect(row).toHaveCount(1);
    await expect(row.locator('[data-col="type"]')).toHaveText('expense');
    await expect(row.locator('[data-col="amount"]')).toHaveText('123,456 ₫');
  });

  test('clears the form after a successful save', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    await txns.add({ type: 'income', amount: 70000, note: uniqueNote('clear') });

    await expect(txns.amountInput).toHaveValue('');
    await expect(txns.noteInput).toHaveValue('');
  });

  test('rejects a zero amount and keeps the form data', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    await txns.add({ type: 'expense', amount: 0, note: 'zero' });

    await expect(txns.formError).toHaveText('amount must be greater than 0');
    await expect(txns.amountInput).toHaveValue('0');
    await expect(txns.formError).toBeVisible();
  });

  test('rejects a non-numeric amount before calling the API', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    await txns.add({ type: 'expense', amount: 'twelve' });

    await expect(txns.formError).toHaveText('Enter a valid number for the amount.');
  });

  test('renders a note as text, never as markup', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    const note = '<img src=x onerror="window.__xss = 1">';
    await txns.add({ type: 'expense', amount: 1000, note });

    const row = txns.rows.filter({ hasText: note });
    await expect(row).toHaveCount(1);
    expect(await page.evaluate(() => (window as Window & { __xss?: number }).__xss)).toBeUndefined();
  });

  test('signing out returns to the passcode form', async ({ page }) => {
    const txns = new TransactionsPage(page);
    await txns.goto();
    await txns.expectLoaded();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Transactions' })).toHaveCount(0);
  });
});
