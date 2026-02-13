// Backoffice I18n 管理
// - listNamespaces：列出所有命名空间
// - listEntries：按命名空间分页列出词条
// - importEntries / exportEntries：导入导出词条

namespace js i18n
service i18n {
  list<string> listNamespaces(),
  list<string> listEntries(1: string ns, 2: i32 page, 3: i32 size),
  bool importEntries(),
  list<string> exportEntries()
}
