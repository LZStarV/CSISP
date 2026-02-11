table "role_permission" {
  schema = schema.public
  comment = "角色-权限关联表：角色与权限的多对多关系"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "role_id" {
    null = false
    type = integer
    comment = "角色 ID"
  }
  column "permission_id" {
    null = false
    type = integer
    comment = "权限 ID"
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "role_permission_permission_id_fkey" {
    columns     = [column.permission_id]
    ref_columns = [table.permission.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "role_permission_role_id_fkey" {
    columns     = [column.role_id]
    ref_columns = [table.role.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
