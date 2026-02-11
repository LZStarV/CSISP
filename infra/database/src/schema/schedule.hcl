table "schedule" {
  schema = schema.public
  comment = "课程课表安排：记录班级在某时间片的教室与地点"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "class_id" {
    null = false
    type = integer
    comment = "班级 ID"
  }
  column "weekday" {
    null = false
    type = integer
    comment = "星期（1-7）"
  }
  column "time_slot_id" {
    null = false
    type = integer
    comment = "时间片 ID"
  }
  column "room" {
    null = false
    type = character_varying(100)
    comment = "教室"
  }
  column "location" {
    null = false
    type = character_varying(255)
    comment = "地点"
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "schedule_class_id_fkey" {
    columns     = [column.class_id]
    ref_columns = [table.class.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "schedule_time_slot_id_fkey" {
    columns     = [column.time_slot_id]
    ref_columns = [table.time_slot.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
