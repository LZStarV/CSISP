import { call, hasError } from '@csisp/rpc/client-fetch';

const BACKOFFICE_PREFIX = '/api/backoffice';

// domain = auth
const authCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, 'auth', action, params);

// domain = db
const dbCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, 'db', action, params);

// domain = user
const userCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, 'user', action, params);

// domain = i18n
const i18nCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, 'i18n', action, params);

// domain = logs
const logsCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, 'logs', action, params);

export { authCall, dbCall, userCall, i18nCall, logsCall, hasError };
