table "user_class" {
  schema = schema.public
  comment = "用户选课班级表：记录用户加入班级的关系与状态"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "user_id" {
    null = false
    type = integer
    comment = "用户 ID"
  }
  column "class_id" {
    null = false
    type = integer
    comment = "班级 ID"
  }
  column "join_time" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "加入时间"
  }
  column "status" {
    null    = false
    type    = integer
    default = 1
    comment = "状态（1 正常）"
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
  foreign_key "user_class_class_id_fkey" {
    columns     = [column.class_id]
    ref_columns = [table.class.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "user_class_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
