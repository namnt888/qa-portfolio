import { expect, test as setup } from '@playwright/test';
import { requirePasscode } from './env';
import { LoginPage } from './pages/LoginPage';
import { TransactionsPage } from './pages/TransactionsPage';

const authFile = 'tests/.auth/user.json';

setup('authenticate once and reuse the session', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.submit(requirePasscode());

  await new TransactionsPage(page).expectLoaded();
  await expect(page).not.toHaveURL(/login/);

  await page.context().storageState({ path: authFile });
});
