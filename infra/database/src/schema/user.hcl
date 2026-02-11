table "user" {
  schema = schema.public
  comment = "用户基础信息表：存储登录账号及核心个人信息"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "username" {
    null = false
    type = character_varying(50)
    comment = "登录用户名"
  }
  column "password" {
    null = false
    type = character_varying(255)
    comment = "加密后的密码"
  }
  column "real_name" {
    null = false
    type = character_varying(255)
    comment = "真实姓名"
  }
  column "student_id" {
    null = false
    type = character_varying(11)
    comment = "学号"
  }
  column "enrollment_year" {
    null = false
    type = integer
    comment = "入学年份"
  }
  column "major" {
    null = false
    type = character_varying(100)
    comment = "专业"
  }
  column "status" {
    null    = false
    type    = integer
    default = 1
    comment = "状态：1-启用，0-禁用"
  }
  column "weak_password_flag" {
    null    = false
    type    = boolean
    default = false
    comment = "弱密码标识"
  }
  column "email" {
    null = true
    type = character_varying(255)
    comment = "邮箱"
  }
  column "phone" {
    null = true
    type = character_varying(20)
    comment = "手机号"
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
  unique "user_email_key" {
    columns = [column.email]
  }
  unique "user_phone_key" {
    columns = [column.phone]
  }
  unique "user_student_id_key" {
    columns = [column.student_id]
  }
  unique "user_username_key" {
    columns = [column.username]
  }
}
