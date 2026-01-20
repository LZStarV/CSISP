import { loadRootEnv } from '@csisp/utils';
loadRootEnv();
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { connect as connectRedis } from '@csisp/redis';
import router from '@router';
import legacyProxy from '@middleware/legacyProxy';
import {
  errorMiddleware,
  corsMiddleware,
  loggerMiddleware,
  jwtAuthMiddleware,
  rateLimitMiddleware,
} from '@middleware/index';
import traceMiddleware from '@middleware/trace';

const app = new Koa();
if (process.env.REDIS_ENABLED === 'true') {
  void connectRedis({});
}
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
