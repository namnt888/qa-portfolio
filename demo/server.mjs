// Bundled demo app used as the system under test.
//
// It exists so this repository runs end-to-end on a fresh clone with no external
// service: `pnpm test` starts it automatically. It is deliberately small and
// in-memory. Every value in it is synthetic.
//
//   node demo/server.mjs
//   DEMO_PORT=4173 DEMO_PASSCODE=demo-passcode node demo/server.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.DEMO_PORT ?? 4173);
const PASSCODE = process.env.DEMO_PASSCODE ?? 'demo-passcode';
const AUTH_TOKEN = 'demo-session-token';
const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));
const MAX_BODY_BYTES = 8 * 1024;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

let transactions = [];
let nextId = 1;
const idempotencyKeys = new Map();

function seed() {
  transactions = [
    {
      id: 'TX-1001',
      type: 'income',
      amount: 24000000,
      currency: 'VND',
      note: 'Salary',
      createdAt: '2026-10-01T02:00:00.000Z',
    },
    {
      id: 'TX-1002',
      type: 'expense',
      amount: 1250000,
      currency: 'VND',
      note: 'Rent',
      createdAt: '2026-10-02T02:00:00.000Z',
    },
    {
      id: 'TX-1003',
      type: 'expense',
      amount: 89000,
      currency: 'VND',
      note: 'Groceries',
      createdAt: '2026-10-03T02:00:00.000Z',
    },
    {
      id: 'TX-1004',
      type: 'income',
      amount: 500000,
      currency: 'VND',
      note: 'Refund',
      createdAt: '2026-10-04T02:00:00.000Z',
    },
  ];
  nextId = 1005;
  idempotencyKeys.clear();
}

seed();

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function isAuthorized(req) {
  return req.headers.authorization === `Bearer ${AUTH_TOKEN}`;
}

function amountHasAtMostTwoDecimals(value) {
  return Math.round(value * 100) === Number((value * 100).toFixed(6));
}

function validateTransaction(body) {
  if (body.type !== 'income' && body.type !== 'expense') {
    return { field: 'type', message: 'type must be "income" or "expense"' };
  }
  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount)) {
    return { field: 'amount', message: 'amount must be a number' };
  }
  if (body.amount <= 0) {
    return { field: 'amount', message: 'amount must be greater than 0' };
  }
  if (body.amount > 1_000_000_000_000) {
    return { field: 'amount', message: 'amount exceeds the supported maximum' };
  }
  if (!amountHasAtMostTwoDecimals(body.amount)) {
    return { field: 'amount', message: 'amount accepts at most 2 decimal places' };
  }
  if (body.note !== undefined && typeof body.note !== 'string') {
    return { field: 'note', message: 'note must be a string' };
  }
  if (typeof body.note === 'string' && body.note.length > 120) {
    return { field: 'note', message: 'note must be 120 characters or fewer' };
  }
  return null;
}

async function handleApi(req, res, url) {
  const { pathname } = url;

  if (pathname === '/api/login' && req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }
    if (typeof body.passcode !== 'string' || body.passcode.length === 0) {
      return json(res, 400, { error: 'validation_error', field: 'passcode' });
    }
    if (body.passcode !== PASSCODE) {
      return json(res, 401, { error: 'invalid_passcode' });
    }
    return json(res, 200, { token: AUTH_TOKEN });
  }

  if (pathname === '/api/_reset' && req.method === 'POST') {
    if (req.headers['x-demo-reset'] !== '1') {
      return json(res, 403, { error: 'forbidden' });
    }
    seed();
    return json(res, 200, { reset: true, count: transactions.length });
  }

  if (!isAuthorized(req)) {
    return json(res, 401, { error: 'unauthorized' });
  }

  if (pathname === '/api/transactions' && req.method === 'GET') {
    const type = url.searchParams.get('type');
    if (type && type !== 'income' && type !== 'expense') {
      return json(res, 400, { error: 'validation_error', field: 'type' });
    }
    const items = type ? transactions.filter((t) => t.type === type) : transactions;
    return json(res, 200, { items, total: items.length });
  }

  if (pathname === '/api/transactions' && req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      return json(res, error.message === 'body_too_large' ? 413 : 400, {
        error: error.message,
      });
    }

    const idempotencyKey = req.headers['idempotency-key'];
    if (typeof idempotencyKey === 'string' && idempotencyKeys.has(idempotencyKey)) {
      return json(res, 409, {
        error: 'duplicate_request',
        id: idempotencyKeys.get(idempotencyKey),
      });
    }

    const invalid = validateTransaction(body);
    if (invalid) {
      return json(res, 400, { error: 'validation_error', ...invalid });
    }

    const item = {
      id: `TX-${nextId}`,
      type: body.type,
      amount: body.amount,
      currency: 'VND',
      note: typeof body.note === 'string' ? body.note.trim() : '',
      createdAt: new Date().toISOString(),
    };
    nextId += 1;
    transactions = [item, ...transactions];

    if (typeof idempotencyKey === 'string') {
      idempotencyKeys.set(idempotencyKey, item.id);
    }

    res.setHeader('location', `/api/transactions/${item.id}`);
    return json(res, 201, { item });
  }

  const deleteMatch = pathname.match(/^\/api\/transactions\/([A-Za-z0-9-]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    const id = deleteMatch[1];
    const before = transactions.length;
    transactions = transactions.filter((t) => t.id !== id);
    if (transactions.length === before) {
      return json(res, 404, { error: 'not_found', id });
    }
    res.writeHead(204);
    return res.end();
  }

  return json(res, 404, { error: 'not_found', path: pathname });
}

async function serveStatic(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = normalize(join(PUBLIC_DIR, relative));
  if (!target.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const content = await readFile(target);
    res.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(target)] ?? 'application/octet-stream',
      'content-length': content.length,
      'cache-control': 'no-store',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  try {
    if (url.pathname === '/health') {
      return json(res, 200, { ok: true });
    }
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url);
    }
    return await serveStatic(res, url.pathname);
  } catch (error) {
    return json(res, 500, { error: 'internal_error', message: error.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`demo app listening on http://127.0.0.1:${PORT}`);
});
