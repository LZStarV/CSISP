table "notification" {
  schema = schema.public
  comment = "系统通知表：记录用户收到的通知信息"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "type" {
    null = false
    type = character_varying(50)
    comment = "通知类型"
  }
  column "title" {
    null = false
    type = character_varying(255)
    comment = "通知标题"
  }
  column "content" {
    null = false
    type = text
    comment = "通知正文"
  }
  column "target_user_id" {
    null = false
    type = integer
    comment = "接收用户 ID"
  }
  column "sender_id" {
    null = false
    type = integer
    comment = "发送者 ID（系统发送可为 0）"
  }
  column "status" {
    null    = false
    type    = character_varying(20)
    default = "unread"
    comment = "状态（unread/read）"
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
  foreign_key "notification_target_user_id_fkey" {
    columns     = [column.target_user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}
