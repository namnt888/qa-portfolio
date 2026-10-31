// Demo app UI. Plain DOM, no build step: the point of this repository is the
// test suite, not the app.

const TOKEN_KEY = 'qa-demo-token';
const el = (id) => document.getElementById(id);

let token = localStorage.getItem(TOKEN_KEY) ?? '';
let items = [];

function formatAmount(value) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)} ₫`;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (token) headers.authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  return fetch(path, { ...options, headers });
}

function showLogin() {
  el('login-view').hidden = false;
  el('app-view').hidden = true;
  el('passcode').focus();
}

function showApp() {
  el('login-view').hidden = true;
  el('app-view').hidden = false;
}

function showError(node, message) {
  node.textContent = message;
  node.hidden = !message;
}

function render() {
  const body = el('txn-rows');
  body.replaceChildren();

  for (const item of items) {
    const row = document.createElement('tr');
    row.dataset.testid = 'txn-row';

    const id = document.createElement('td');
    id.dataset.col = 'id';
    id.textContent = item.id;

    const type = document.createElement('td');
    type.dataset.col = 'type';
    type.textContent = item.type;

    const amount = document.createElement('td');
    amount.dataset.col = 'amount';
    amount.className = `amount ${item.type}`;
    amount.textContent = formatAmount(item.amount);

    const note = document.createElement('td');
    note.dataset.col = 'note';
    note.className = 'note';
    note.textContent = item.note;

    row.append(id, type, amount, note);
    body.append(row);
  }

  el('empty-state').hidden = items.length > 0;

  const balance = items.reduce(
    (sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount),
    0
  );
  el('balance').textContent = formatAmount(balance);
  el('balance').dataset.balance = String(balance);
}

async function loadTransactions() {
  const filter = el('filter').value;
  const query = filter ? `?type=${filter}` : '';
  const response = await api(`/api/transactions${query}`);
  if (response.status === 401) {
    logout();
    return;
  }
  const payload = await response.json();
  items = payload.items;
  render();
}

async function login(event) {
  event.preventDefault();
  const passcode = el('passcode').value;
  const response = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    showError(
      el('login-error'),
      response.status === 401 ? 'Incorrect passcode.' : (payload.error ?? 'Sign-in failed.')
    );
    return;
  }

  const payload = await response.json();
  token = payload.token;
  localStorage.setItem(TOKEN_KEY, token);
  showError(el('login-error'), '');
  showApp();
  await loadTransactions();
}

async function addTransaction(event) {
  event.preventDefault();
  const raw = el('amount').value.trim();
  const amount = raw === '' ? Number.NaN : Number(raw);

  if (!Number.isFinite(amount)) {
    showError(el('form-error'), 'Enter a valid number for the amount.');
    return;
  }

  const response = await api('/api/transactions', {
    method: 'POST',
    headers: { 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify({ type: el('type').value, amount, note: el('note').value }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    showError(el('form-error'), payload.message ?? 'Could not add the transaction.');
    return;
  }

  showError(el('form-error'), '');
  el('amount').value = '';
  el('note').value = '';
  await loadTransactions();
}

function logout() {
  token = '';
  items = [];
  localStorage.removeItem(TOKEN_KEY);
  showLogin();
}

el('login-form').addEventListener('submit', login);
el('txn-form').addEventListener('submit', addTransaction);
el('filter').addEventListener('change', loadTransactions);
el('logout').addEventListener('click', logout);

if (token) {
  showApp();
  loadTransactions().catch(() => logout());
} else {
  showLogin();
}
