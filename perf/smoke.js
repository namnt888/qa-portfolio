import http from 'k6/http';
import { check, sleep } from 'k6';

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

export default function () {
  const res = http.get(`${__ENV.BASE_URL ?? 'http://localhost:3000'}/transactions`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
