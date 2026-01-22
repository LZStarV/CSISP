import { loadRootEnv } from '@csisp/utils';
import { connect as connectRedis } from '@infra/redis';
import { setupMiddlewares } from '@middleware';
import legacyProxy from '@middleware/legacyProxy';
import router from '@modules';
import Koa from 'koa';

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
