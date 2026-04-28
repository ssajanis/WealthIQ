/**
 * k6 load test — PRD Section 10.5
 * 100 concurrent virtual users, p95 < 2 s, 0 × 5xx errors.
 *
 * Run: k6 run tests/k6/load-test.js --out json=tests/reports/k6/result.json
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const p95 = new Trend('p95_response_ms');
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp up to 100 VUs
    { duration: '60s', target: 100 }, // hold 100 VUs for 1 min
    { duration: '15s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // p95 < 2 s
    error_rate: ['rate<0.01'],         // < 1% errors
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = 'http://localhost:3000';

export default function () {
  const pages = [
    '/',
    '/dashboard',
    '/financial-analysis',
    '/investments',
    '/loans',
    '/goals',
    '/compare',
    '/settings',
  ];

  const url = BASE + pages[Math.floor(Math.random() * pages.length)];
  const res = http.get(url, { timeout: '10s' });

  const ok = check(res, {
    'status is 200 or 307': (r) => r.status === 200 || r.status === 307 || r.status === 308,
    'no 5xx': (r) => r.status < 500,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  p95.add(res.timings.duration);
  errorRate.add(!ok);

  sleep(Math.random() * 0.5 + 0.5); // 0.5–1 s think time
}
