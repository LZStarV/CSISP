// Backoffice DB 只读查询
// - struct QueryTableResponse：分页结果
// - service DB：列出模型、分页查询、按主键读取

namespace js db
include "common.thrift"
typedef map<string, string> Row
struct QueryTableResponse {
  1: list<Row> items,
  2: i32 page,
  3: i32 size,
  4: i64 total
}
service db {
  list<string> listModels(),
  QueryTableResponse queryTable(1: string table, 2: i32 page, 3: i32 size, 4: string orderBy, 5: string orderDir),
  string getRecord(1: string table, 2: string id)
}
