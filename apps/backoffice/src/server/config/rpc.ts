export enum Domain {
  OIDC = 'oidc',
  USER = 'user',
  DB = 'db',
  LOGS = 'logs',
  I18N = 'i18n',
}

export enum I18nAction {
  IMPORT_ENTRIES = 'importEntries',
  EXPORT_ENTRIES = 'exportEntries',
}

export const I18N_ACTION_ALIAS: Record<string, I18nAction> = {};
