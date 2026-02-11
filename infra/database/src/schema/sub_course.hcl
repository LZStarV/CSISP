table "sub_course" {
  schema = schema.public
  comment = "分课程表：记录课程的分支/子课程信息与任课教师"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "course_id" {
    null = false
    type = integer
    comment = "课程 ID"
  }
  column "sub_course_code" {
    null = false
    type = character_varying(50)
    comment = "子课程代号（唯一）"
  }
  column "teacher_id" {
    null = false
    type = integer
    comment = "任课教师 ID"
  }
  column "academic_year" {
    null = false
    type = integer
    comment = "学年"
  }
  column "status" {
    null    = false
    type    = integer
    default = 1
    comment = "状态（1 正常）"
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "sub_course_course_id_fkey" {
    columns     = [column.course_id]
    ref_columns = [table.course.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "sub_course_teacher_id_fkey" {
    columns     = [column.teacher_id]
    ref_columns = [table.teacher.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
