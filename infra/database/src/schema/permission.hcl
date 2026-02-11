table "permission" {
  schema = schema.public
  comment = "权限项定义表：记录系统原子功能权限"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "name" {
    null = false
    type = character_varying(100)
    comment = "权限名称"
  }
  column "code" {
    null = false
    type = character_varying(100)
    comment = "权限代码（唯一，如 user:create）"
  }
  column "description" {
    null = true
    type = text
    comment = "权限详细描述"
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
  unique "permission_code_key" {
    columns = [column.code]
  }
}
