import { request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { requirePasscode, resolveBaseUrl } from '../env';

export interface LedgerApiClient {
  ctx: APIRequestContext;
  auth: Record<string, string>;
  login: (passcode: string) => Promise<APIResponse>;
  list: (type?: 'income' | 'expense') => Promise<APIResponse>;
  /** `payload` is untyped on purpose: negative tests send malformed bodies. */
  create: (payload: unknown, idempotencyKey?: string) => Promise<APIResponse>;
  remove: (id: string) => Promise<APIResponse>;
  dispose: () => Promise<void>;
}

export async function createApiClient(): Promise<LedgerApiClient> {
  const ctx = await request.newContext({
    baseURL: resolveBaseUrl(),
    extraHTTPHeaders: { accept: 'application/json' },
  });

  const login = (passcode: string) => ctx.post('/api/login', { data: { passcode } });

  const loginResponse = await login(requirePasscode());
  const { token } = await loginResponse.json();
  const auth = { authorization: `Bearer ${token}` };

  return {
    ctx,
    auth,
    login,
    list: (type) => ctx.get(`/api/transactions${type ? `?type=${type}` : ''}`, { headers: auth }),
    create: (payload, idempotencyKey) =>
      ctx.post('/api/transactions', {
        data: payload,
        headers: idempotencyKey ? { ...auth, 'idempotency-key': idempotencyKey } : auth,
      }),
    remove: (id) => ctx.delete(`/api/transactions/${id}`, { headers: auth }),
    dispose: () => ctx.dispose(),
  };
}
