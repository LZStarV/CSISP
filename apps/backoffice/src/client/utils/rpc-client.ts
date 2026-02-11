import { auth, db, i18n, logs, user } from '@csisp/idl/backoffice';
import { call, hasError } from '@csisp/rpc/client-fetch';

const BACKOFFICE_PREFIX = '/api/backoffice';

// domain = auth
const authCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, auth.serviceName, action, params);

// domain = db
const dbCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, db.serviceName, action, params);

// domain = user
const userCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, user.serviceName, action, params);

// domain = i18n
const i18nCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, i18n.serviceName, action, params);

// domain = logs
const logsCall = <T>(action: string, params?: any) =>
  call<T>(BACKOFFICE_PREFIX, logs.serviceName, action, params);

export { authCall, dbCall, userCall, i18nCall, logsCall, hasError };
