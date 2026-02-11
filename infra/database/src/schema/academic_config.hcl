table "academic_config" {
  schema = schema.public
  comment = "学期教学配置：定义学年、学期及其起止日期"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "year" {
    null = false
    type = character_varying(10)
    comment = "学年（如 2023-2024）"
  }
  column "semester" {
    null = false
    type = integer
    comment = "学期（1-第一学期，2-第二学期）"
  }
  column "start_date" {
    null = false
    type = timestamptz
    comment = "学期开始日期"
  }
  column "end_date" {
    null = false
    type = timestamptz
    comment = "学期结束日期"
  }
  column "is_current" {
    null    = false
    type    = boolean
    default = false
    comment = "是否为当前学期"
  }
  column "status" {
    null    = false
    type    = integer
    default = 1
    comment = "状态（1 正常）"
  }
  primary_key {
    columns = [column.id]
  }
}
