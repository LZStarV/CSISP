import * as auth from './handlers/auth';
import * as db from './handlers/db';
import * as i18n from './handlers/i18n';
import * as logs from './handlers/logs';
import * as user from './handlers/user';

export type Handler = (params: unknown, headers: Headers) => Promise<unknown>;

export const registry: Record<string, Record<string, Handler>> = {
  auth,
  user,
  db,
  logs,
  i18n,
};
