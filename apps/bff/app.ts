import 'dotenv/config';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import router from './src/router';
import {
  errorMiddleware,
  corsMiddleware,
  loggerMiddleware,
  jwtAuthMiddleware,
  rateLimitMiddleware,
} from './src/middleware';

const app = new Koa();
app.use(errorMiddleware());
app.use(corsMiddleware());
app.use(loggerMiddleware());
app.use(bodyParser());
app.use(jwtAuthMiddleware());
app.use(rateLimitMiddleware());
app.use(router.routes());
app.use(router.allowedMethods());
const PORT = Number(process.env.BFF_PORT ?? 4000);
app.listen(PORT, () => {
  process.stdout.write(`BFF server is running on port ${PORT}\n`);
});
