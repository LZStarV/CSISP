import { loadRootEnv } from '@csisp/utils';
import Koa from 'koa';
import { connect as connectRedis } from '@infra/redis';
import router from '@modules';
import legacyProxy from '@middleware/legacyProxy';
import { setupMiddlewares } from '@middleware';

loadRootEnv();

const app = new Koa();
if (process.env.REDIS_ENABLED === 'true') {
  void connectRedis({});
}
setupMiddlewares(app);
app.use(router.routes());
app.use(legacyProxy());
app.use(router.allowedMethods());
const PORT = Number(process.env.BFF_PORT ?? 4000);
app.listen(PORT, () => {
  process.stdout.write(`BFF server is running on port ${PORT}\n`);
});
