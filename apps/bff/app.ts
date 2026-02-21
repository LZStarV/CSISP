import { connect as connectRedis } from '@infra/redis';
import { setupMiddlewares } from '@middleware';
import legacyProxy from '@middleware/legacyProxy';
import router from '@modules';
import Koa from 'koa';

import { config } from './src/config';

const app = new Koa();
void connectRedis({});
setupMiddlewares(app);
app.use(router.routes());
app.use(legacyProxy());
app.use(router.allowedMethods());
const PORT = config.http.port;
app.listen(PORT, () => {
  process.stdout.write(`BFF server is running on port ${PORT}\n`);
});
