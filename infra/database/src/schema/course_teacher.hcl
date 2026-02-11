table "course_teacher" {
  schema = schema.public
  comment = "课程教师关联：记录班级与任课教师的多对多关系"
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
  column "teacher_id" {
    null = false
    type = integer
    comment = "关联教师 ID"
  }
  column "is_primary" {
    null    = false
    type    = boolean
    default = false
    comment = "是否为主讲教师"
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
  foreign_key "course_teacher_class_id_fkey" {
    columns     = [column.class_id]
    ref_columns = [table.class.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "course_teacher_teacher_id_fkey" {
    columns     = [column.teacher_id]
    ref_columns = [table.teacher.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  unique "course_teacher_class_id_teacher_id_uk" {
    columns = [column.class_id, column.teacher_id]
  }
}
