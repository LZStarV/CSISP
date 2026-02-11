table "time_slot" {
  schema = schema.public
  comment = "上课时间片表：记录课程的周次与时间段安排"
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
  column "week_day" {
    null = false
    type = integer
    comment = "星期（1-7）"
  }
  column "start_time" {
    null = false
    type = character_varying(10)
    comment = "开始时间（HH:mm）"
  }
  column "end_time" {
    null = false
    type = character_varying(10)
    comment = "结束时间（HH:mm）"
  }
  column "location" {
    null = true
    type = character_varying(255)
    comment = "上课地点（可空）"
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
  foreign_key "time_slot_course_id_fkey" {
    columns     = [column.course_id]
    ref_columns = [table.course.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
