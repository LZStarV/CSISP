import { request } from 'undici';

async function main() {
  const res = await request('http://localhost:3000/api/bff/health');
  const body = await res.body.json();
  process.stdout.write(JSON.stringify(body) + '\n');
}

main();
