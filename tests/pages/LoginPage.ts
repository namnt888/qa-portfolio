import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly passcodeInput: Locator;
  readonly submitButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.passcodeInput = page.getByLabel('Passcode');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.error = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async submit(passcode: string): Promise<void> {
    await this.passcodeInput.fill(passcode);
    await this.submitButton.click();
  }

  async expectVisible(): Promise<void> {
    await expect(this.passcodeInput).toBeVisible();
  }
}
