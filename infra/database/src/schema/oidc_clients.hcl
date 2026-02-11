table "oidc_clients" {
  schema = schema.public
  comment = "OIDC 客户端注册表：记录允许接入的第三方应用配置"
  column "client_id" {
    null = false
    type = character_varying(255)
    comment = "客户端唯一 ID"
  }
  column "client_secret" {
    null = true
    type = character_varying(255)
    comment = "客户端密钥"
  }
  column "name" {
    null = true
    type = character_varying(255)
    comment = "客户端名称"
  }
  column "allowed_redirect_uris" {
    null = false
    type = jsonb
    comment = "允许的回调 URI 列表（JSON 数组）"
  }
  column "scopes" {
    null = true
    type = jsonb
    comment = "允许的权限范围列表（JSON 数组）"
  }
  column "status" {
    null    = false
    type    = character_varying(20)
    default = "active"
    comment = "状态（active/disabled）"
  }
  column "created_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "创建时间"
  }
  column "updated_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "更新时间"
  }
  primary_key {
    columns = [column.client_id]
  }
}
