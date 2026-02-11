table "course_rep" {
  schema = schema.public
  comment = "课代表管理：记录班级的学生课代表信息"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "class_id" {
    null = false
    type = integer
    comment = "关联班级 ID"
  }
  column "user_id" {
    null = false
    type = integer
    comment = "关联用户 ID"
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
  foreign_key "course_rep_class_id_fkey" {
    columns     = [column.class_id]
    ref_columns = [table.class.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "course_rep_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  unique "course_rep_class_id_user_id_uk" {
    columns = [column.class_id, column.user_id]
  }
}
