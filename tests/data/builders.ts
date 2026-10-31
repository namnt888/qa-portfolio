export interface TransactionPayload {
  type: 'income' | 'expense';
  amount: number;
  note?: string;
}

/** Defaults are valid; pass only the field a test is about. */
export function aTransaction(overrides: Partial<TransactionPayload> = {}): TransactionPayload {
  return {
    type: 'expense',
    amount: 50_000,
    note: 'Test transaction',
    ...overrides,
  };
}

let counter = 0;

/** Distinct per run so assertions never depend on leftover data. */
export function uniqueNote(prefix = 'auto'): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
