import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: false });
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import router from './src/router';
import legacyProxy from './src/middleware/legacyProxy';
import {
  errorMiddleware,
  corsMiddleware,
  loggerMiddleware,
  jwtAuthMiddleware,
  rateLimitMiddleware,
} from './src/middleware';
import traceMiddleware from './src/middleware/trace';

const app = new Koa();
app.use(errorMiddleware());
app.use(corsMiddleware());
app.use(loggerMiddleware());
app.use(traceMiddleware());
app.use(bodyParser());
app.use(jwtAuthMiddleware());
app.use(rateLimitMiddleware());
app.use(router.routes());
app.use(legacyProxy());
app.use(router.allowedMethods());
const PORT = Number(process.env.BFF_PORT ?? 4000);
app.listen(PORT, () => {
  process.stdout.write(`BFF server is running on port ${PORT}\n`);
});
