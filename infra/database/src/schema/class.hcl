table "class" {
  schema = schema.public
  comment = "教学班级表：定义某门课程下的具体教学班"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "course_id" {
    null = false
    type = integer
    comment = "所属课程 ID"
  }
  column "name" {
    null = false
    type = character_varying(100)
    comment = "班级名称"
  }
  column "code" {
    null = false
    type = character_varying(50)
    comment = "班级代码（唯一）"
  }
  column "capacity" {
    null    = false
    type    = integer
    default = 0
    comment = "班级容量"
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
  foreign_key "class_course_id_fkey" {
    columns     = [column.course_id]
    ref_columns = [table.course.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  unique "class_code_key" {
    columns = [column.code]
  }
}
