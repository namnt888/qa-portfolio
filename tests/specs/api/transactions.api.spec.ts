import { expect, test } from '@playwright/test';
import { createApiClient, type LedgerApiClient } from '../../api/client';
import { aTransaction, uniqueNote } from '../../data/builders';

let api: LedgerApiClient;

test.beforeAll(async () => {
  api = await createApiClient();
});

test.afterAll(async () => {
  await api.dispose();
});

test.describe('auth', () => {
  test('rejects an unknown passcode with 401', async () => {
    const response = await api.login('not-the-passcode');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'invalid_passcode' });
  });

  test('rejects a missing passcode with 400', async () => {
    const response = await api.ctx.post('/api/login', { data: {} });

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ field: 'passcode' });
  });

  test('requires a bearer token to read the ledger', async () => {
    const response = await api.ctx.get('/api/transactions');

    expect(response.status()).toBe(401);
  });
});

test.describe('GET /api/transactions', () => {
  test('returns items and a matching total', async () => {
    const response = await api.list();

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBe(body.items.length);
  });

  test('filters by type without leaking the other type', async () => {
    const response = await api.list('income');

    expect(response.status()).toBe(200);
    const { items } = await response.json();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item.type).toBe('income');
  });

  test('rejects an unknown type filter with 400', async () => {
    const response = await api.ctx.get('/api/transactions?type=transfer', {
      headers: api.auth,
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ field: 'type' });
  });
});

test.describe('POST /api/transactions', () => {
  test('creates a transaction and returns a Location header', async () => {
    const note = uniqueNote('api-create');
    const response = await api.create(aTransaction({ amount: 250000, note }));

    expect(response.status()).toBe(201);
    const { item } = await response.json();
    expect(item).toMatchObject({ type: 'expense', amount: 250000, note, currency: 'VND' });
    expect(item.id).toMatch(/^TX-\d+$/);
    expect(response.headers()['location']).toBe(`/api/transactions/${item.id}`);

    const listed = await (await api.list()).json();
    expect(listed.items.map((entry: { id: string }) => entry.id)).toContain(item.id);
  });

  test('returns the newest transaction first', async () => {
    const older = await (await api.create(aTransaction({ note: uniqueNote('order-a') }))).json();
    const newer = await (await api.create(aTransaction({ note: uniqueNote('order-b') }))).json();

    const { items } = await (await api.list()).json();
    const ids = items.map((entry: { id: string }) => entry.id);
    expect(ids.indexOf(newer.item.id)).toBeLessThan(ids.indexOf(older.item.id));
  });

  test('treats a repeated idempotency key as a conflict', async () => {
    const key = uniqueNote('idem');

    const first = await api.create(aTransaction({ amount: 1000 }), key);
    expect(first.status()).toBe(201);
    const { item } = await first.json();

    const second = await api.create(aTransaction({ amount: 1000 }), key);
    expect(second.status()).toBe(409);
    expect(await second.json()).toMatchObject({ error: 'duplicate_request', id: item.id });
  });

  const invalidCases: Array<{ name: string; payload: unknown; field: string }> = [
    { name: 'a zero amount', payload: aTransaction({ amount: 0 }), field: 'amount' },
    { name: 'a negative amount', payload: aTransaction({ amount: -100 }), field: 'amount' },
    {
      name: 'a string amount',
      payload: { type: 'expense', amount: '100' },
      field: 'amount',
    },
    { name: 'three decimal places', payload: aTransaction({ amount: 1.005 }), field: 'amount' },
    { name: 'an unknown type', payload: { type: 'transfer', amount: 100 }, field: 'type' },
    { name: 'a note over 120 characters', payload: aTransaction({ note: 'x'.repeat(121) }), field: 'note' },
  ];

  for (const invalidCase of invalidCases) {
    test(`rejects ${invalidCase.name} with 400`, async () => {
      const response = await api.create(invalidCase.payload);

      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({
        error: 'validation_error',
        field: invalidCase.field,
      });
    });
  }
});

test.describe('DELETE /api/transactions/:id', () => {
  test('deletes an existing transaction once', async () => {
    const created = await api.create(aTransaction({ note: uniqueNote('delete') }));
    const { item } = await created.json();

    const deleted = await api.remove(item.id);
    expect(deleted.status()).toBe(204);

    const again = await api.remove(item.id);
    expect(again.status()).toBe(404);
    expect(await again.json()).toMatchObject({ error: 'not_found', id: item.id });
  });

  test('returns 404 for an unknown id', async () => {
    const response = await api.remove('TX-does-not-exist');

    expect(response.status()).toBe(404);
  });
});
