table "teacher" {
  schema = schema.public
  comment = "教师表：记录教师的基本信息"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "user_id" {
    null = true
    type = integer
    comment = "关联用户 ID（可空）"
  }
  column "real_name" {
    null = false
    type = character_varying(255)
    comment = "教师姓名"
  }
  column "email" {
    null = false
    type = character_varying(255)
    comment = "邮箱（唯一）"
  }
  column "phone" {
    null = false
    type = character_varying(20)
    comment = "手机号（唯一）"
  }
  column "department" {
    null = false
    type = character_varying(255)
    comment = "所属院系"
  }
  column "title" {
    null = true
    type = character_varying(100)
    comment = "职称（可空）"
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
  foreign_key "teacher_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = SET_NULL
  }
  unique "teacher_email_key" {
    columns = [column.email]
  }
  unique "teacher_phone_key" {
    columns = [column.phone]
  }
}
