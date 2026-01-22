import * as auth from './auth/auth.module';
import * as db from './db/db.module';
import * as i18n from './i18n/i18n.module';
import * as logs from './logger/logger.module';
import * as user from './user/user.module';

export const modules = [auth, user, db, i18n, logs];

export function buildOpenRPC() {
  const methods: any[] = [];
  for (const m of modules) {
    for (const [action, def] of Object.entries(m.schemas)) {
      methods.push({
        name: `${m.domain}.${action}`,
        summary: (def as any)?.summary || '',
        description: (def as any)?.description || '',
        params: (def as any)?.params || {},
        result: (def as any)?.result || {},
      });
    }
  }
  return { methods };
}
