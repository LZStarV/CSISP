table "password_resets" {
  schema = schema.public
  comment = "重置密码记录：存储重置令牌与有效期"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "user_id" {
    null = false
    type = integer
    comment = "关联用户 ID"
  }
  column "token_hash" {
    null = false
    type = character_varying(255)
    comment = "重置令牌哈希"
  }
  column "expires_at" {
    null = false
    type = timestamptz
    comment = "过期时间"
  }
  column "used" {
    null    = false
    type    = boolean
    default = false
    comment = "是否已使用"
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
    columns = [column.id]
  }
  foreign_key "password_resets_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  index "password_resets_token_hash_idx" {
    columns = [column.token_hash]
  }
}
