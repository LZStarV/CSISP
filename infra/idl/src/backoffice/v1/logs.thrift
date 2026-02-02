// Backoffice Logs 查询
// - search：按级别与 traceId 分页检索
// - stream：日志流占位（返回布尔标识）

namespace js logs
service logs {
  list<string> search(1: string level, 2: string traceId, 3: i32 page, 4: i32 size),
  bool stream()
}
