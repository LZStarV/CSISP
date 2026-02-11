table "attendance_task" {
  schema = schema.public
  comment = "考勤任务：定义某节课或某次活动的考勤规则"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "course_id" {
    null = false
    type = integer
    comment = "关联课程 ID"
  }
  column "title" {
    null = false
    type = character_varying(255)
    comment = "考勤标题"
  }
  column "start_time" {
    null = false
    type = timestamptz
    comment = "允许签到开始时间"
  }
  column "end_time" {
    null = false
    type = timestamptz
    comment = "允许签到结束时间"
  }
  column "code" {
    null = true
    type = character_varying(10)
    comment = "签到码（可选）"
  }
  column "status" {
    null    = false
    type    = integer
    default = 1
    comment = "任务状态（1 开启，0 关闭）"
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
  foreign_key "attendance_task_course_id_fkey" {
    columns     = [column.course_id]
    ref_columns = [table.course.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
