export enum Domain {
  AUTH = 'auth',
  USER = 'user',
  DB = 'db',
  LOGS = 'logs',
  I18N = 'i18n',
}

export enum I18nAction {
  IMPORT = 'import',
  EXPORT = 'export',
  IMPORT_ENTRIES = 'importEntries',
  EXPORT_ENTRIES = 'exportEntries',
}

export const I18N_ACTION_ALIAS: Record<string, string> = {
  [I18nAction.IMPORT]: I18nAction.IMPORT_ENTRIES,
  [I18nAction.EXPORT]: I18nAction.EXPORT_ENTRIES,
};
