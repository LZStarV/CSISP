table "role" {
  schema = schema.public
  comment = "角色表：定义系统角色与权限聚合"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "name" {
    null = false
    type = character_varying(50)
    comment = "角色名称（唯一）"
  }
  column "code" {
    null = false
    type = character_varying(50)
    comment = "角色编码（唯一）"
  }
  column "description" {
    null = true
    type = text
    comment = "角色描述"
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
  unique "role_code_key" {
    columns = [column.code]
  }
  unique "role_name_key" {
    columns = [column.name]
  }
}
