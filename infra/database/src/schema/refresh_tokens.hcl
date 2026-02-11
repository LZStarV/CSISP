table "refresh_tokens" {
  schema = schema.public
  comment = "刷新令牌表：存储 OAuth2/OIDC 刷新令牌及其状态"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "client_id" {
    null = false
    type = character_varying(255)
    comment = "客户端 ID"
  }
  column "sub_hash" {
    null = false
    type = character_varying(255)
    comment = "Subject 哈希值"
  }
  column "rt_hash" {
    null = false
    type = character_varying(255)
    comment = "RefreshToken 哈希值"
  }
  column "status" {
    null    = false
    type    = character_varying(20)
    default = "active"
    comment = "状态（active/revoked/expired）"
  }
  column "created_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "创建时间"
  }
  column "last_used_at" {
    null = true
    type = timestamptz
    comment = "最后使用时间"
  }
  column "prev_id" {
    null = true
    type = integer
    comment = "前一个令牌 ID (用于滚动更新防重放)"
  }
  primary_key {
    columns = [column.id]
  }
}
