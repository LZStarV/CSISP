table "user_role" {
  schema = schema.public
  comment = "用户角色关联表：用户与角色的多对多关联"
  column "user_id" {
    null = false
    type = integer
    comment = "用户 ID（复合主键）"
  }
  column "role_id" {
    null = false
    type = integer
    comment = "角色 ID（复合主键）"
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
    columns = [column.user_id, column.role_id]
  }
  foreign_key "user_role_role_id_fkey" {
    columns     = [column.role_id]
    ref_columns = [table.role.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "user_role_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
