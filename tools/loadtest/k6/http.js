import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '15s',
};

export default function () {
  const res = http.get(__ENV.TARGET || 'http://127.0.0.1:3000/health/live');
  check(res, { live: (r) => r.status === 200 });
  sleep(0.2);
}
