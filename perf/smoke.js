import http from 'k6/http';
import { check, sleep } from 'k6';

// Optional load script. k6 is a standalone binary, not an npm dependency:
//   brew install k6
//   k6 run perf/smoke.js
//
// It targets the bundled demo app by default. Point BASE_URL at a staging host
// to use it there — never at production.

const BASE_URL = __ENV.BASE_URL ?? 'http://127.0.0.1:4173';
const PASSCODE = __ENV.DEMO_PASSCODE ?? 'demo-passcode';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const response = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ passcode: PASSCODE }),
    { headers: { 'content-type': 'application/json' } }
  );
  check(response, { 'login succeeded': (r) => r.status === 200 });
  return { token: response.json('token') };
}

export default function (data) {
  const response = http.get(`${BASE_URL}/api/transactions`, {
    headers: { authorization: `Bearer ${data.token}` },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'body carries an items array': (r) => Array.isArray(r.json('items')),
  });

  sleep(1);
}
