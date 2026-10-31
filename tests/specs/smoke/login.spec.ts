import { expect, test } from '@playwright/test';
import { requirePasscode } from '../../env';
import { LoginPage } from '../../pages/LoginPage';
import { TransactionsPage } from '../../pages/TransactionsPage';

// These tests are about the unauthenticated state, so they opt out of the
// shared signed-in storage state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('login', () => {
  test('shows the passcode form to a visitor with no session', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.expectVisible();
    await expect(login.submitButton).toBeEnabled();
  });

  test('rejects a wrong passcode without leaving the login view', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit('definitely-not-the-passcode');

    await expect(login.error).toHaveText('Incorrect passcode.');
    await expect(page.getByRole('heading', { name: 'Transactions' })).toHaveCount(0);
  });

  test('accepts the configured passcode and opens the ledger', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit(requirePasscode());

    await new TransactionsPage(page).expectLoaded();
  });
});
