import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { requirePasscode } from '../../env';
import { LoginPage } from '../../pages/LoginPage';
import { TransactionsPage, type TransactionType } from '../../pages/TransactionsPage';

const { Given, When, Then } = createBdd();

Given('I am signed in', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.submit(requirePasscode());
  await new TransactionsPage(page).expectLoaded();
});

When('I filter the ledger by {string}', async ({ page }, type: string) => {
  await new TransactionsPage(page).filterBy(type as TransactionType);
});

Then('every visible row is an {string}', async ({ page }, type: string) => {
  const rows = page.getByTestId('txn-row');
  await expect(rows.first()).toBeVisible();

  for (const text of await rows.allInnerTexts()) {
    expect(text.toLowerCase()).toContain(type.toLowerCase());
  }
});

When(
  'I add an expense of {int} with note {string}',
  async ({ page }, amount: number, note: string) => {
    await new TransactionsPage(page).add({ type: 'expense', amount, note });
  }
);

Then(
  'the first row shows {string} with note {string}',
  async ({ page }, amountText: string, note: string) => {
    const row = page.getByTestId('txn-row').first();
    await expect(row.locator('[data-col="amount"]')).toHaveText(amountText);
    await expect(row.locator('[data-col="note"]')).toHaveText(note);
  }
);
