table "attendance_record" {
  schema = schema.public
  comment = "考勤签到记录：记录用户针对某考勤任务的签到结果"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "task_id" {
    null = false
    type = integer
    comment = "关联考勤任务 ID"
  }
  column "user_id" {
    null = false
    type = integer
    comment = "关联用户 ID"
  }
  column "checkin_time" {
    null = false
    type = timestamptz
    comment = "签到时间"
  }
  column "status" {
    null    = false
    type    = character_varying(50)
    default = "present"
    comment = "签到状态（present-出勤，late-迟到，absent-缺勤）"
  }
  column "ip_address" {
    null = true
    type = character_varying(50)
    comment = "签到时的 IP 地址"
  }
  column "device_info" {
    null = true
    type = text
    comment = "签到设备信息"
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
  foreign_key "attendance_record_task_id_fkey" {
    columns     = [column.task_id]
    ref_columns = [table.attendance_task.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "attendance_record_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  unique "attendance_record_task_id_user_id_uk" {
    columns = [column.task_id, column.user_id]
  }
}
