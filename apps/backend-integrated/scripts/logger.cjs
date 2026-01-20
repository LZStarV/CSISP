const pino = require('pino');
const path = require('path');
const fs = require('fs');

function ensureDir(d) {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch {}
}

function createLogger(service) {
  const level = process.env.LOG_LEVEL || 'info';
  const dev = (process.env.NODE_ENV || 'development') !== 'production';
  const pretty = (process.env.LOG_PRETTY_CONSOLE ?? 'true') !== 'false';
  const toFile = (process.env.LOG_TO_FILE ?? 'false') === 'true';

  let logger;
  if (dev && pretty) {
    logger = pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', singleLine: true },
      },
    });
  } else {
    logger = pino({ level });
  }

  if (toFile) {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const logDir = path.resolve(repoRoot, process.env.LOG_DIR || 'log');
    const envDir = path.join(logDir, process.env.NODE_ENV || 'development');
    const serviceDir = path.join(envDir, service);
    ensureDir(serviceDir);
    const d = new Date();
    const filePath = path.join(
      serviceDir,
      `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.log`
    );
    const dest = pino.destination({ dest: filePath, mkdir: true, append: true, sync: false });
    logger = pino({ level }, dest);
  }
  return logger.child({ service });
}

module.exports = { createLogger };
