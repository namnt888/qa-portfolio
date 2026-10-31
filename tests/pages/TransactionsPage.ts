import { expect, type Locator, type Page } from '@playwright/test';

export type TransactionType = 'income' | 'expense';

export interface NewTransaction {
  type: TransactionType;
  amount: number | string;
  note?: string;
}

export class TransactionsPage {
  readonly heading: Locator;
  readonly balance: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;
  readonly filter: Locator;
  readonly typeSelect: Locator;
  readonly amountInput: Locator;
  readonly noteInput: Locator;
  readonly addButton: Locator;
  readonly formError: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Transactions' });
    this.balance = page.locator('#balance');
    this.rows = page.getByTestId('txn-row');
    this.emptyState = page.getByText('No transactions yet.');
    this.filter = page.getByLabel('Show');
    this.typeSelect = page.getByLabel('Type');
    this.amountInput = page.getByLabel('Amount (VND)');
    this.noteInput = page.getByLabel('Note');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.formError = page.locator('#form-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Sign in' })).toHaveCount(0);
  }

  async filterBy(type: TransactionType | 'all'): Promise<void> {
    await this.filter.selectOption(type === 'all' ? '' : type);
    await expect(this.rows.first()).toBeVisible();
  }

  async add(transaction: NewTransaction): Promise<void> {
    await this.typeSelect.selectOption(transaction.type);
    await this.amountInput.fill(String(transaction.amount));
    if (transaction.note !== undefined) await this.noteInput.fill(transaction.note);
    await this.addButton.click();
  }
}
