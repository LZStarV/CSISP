table "homework" {
  schema = schema.public
  comment = "作业发布表：记录班级的作业发布信息"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "class_id" {
    null = false
    type = integer
    comment = "所属班级 ID"
  }
  column "title" {
    null = false
    type = character_varying(255)
    comment = "作业标题"
  }
  column "content" {
    null = true
    type = text
    comment = "作业详细内容"
  }
  column "deadline" {
    null = false
    type = timestamptz
    comment = "截止提交时间"
  }
  column "status" {
    null    = false
    type    = integer
    default = 1
    comment = "状态（1 发布，0 暂存）"
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
  foreign_key "homework_class_id_fkey" {
    columns     = [column.class_id]
    ref_columns = [table.class.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
