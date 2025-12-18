import { spawn } from 'node:child_process';

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
    p.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(String(code)));
    });
  });
}

async function main() {
  const action = process.argv[2] || '';
  const env = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5433',
    DB_USER: process.env.DB_USER || 'admin',
    DB_PASSWORD: process.env.DB_PASSWORD || 'password',
    DB_NAME: process.env.DB_NAME || 'csisp',
  };
  if (action === 'migrate') {
    await run('pnpm', ['exec sequelize-cli db:migrate'], env);
  } else if (action === 'seed') {
    await run('pnpm', ['exec sequelize-cli db:seed:all'], env);
  } else {
    process.stderr.write('Usage: node cli.mjs [migrate|seed]\n');
    process.exit(1);
  }
}

main().catch(err => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
