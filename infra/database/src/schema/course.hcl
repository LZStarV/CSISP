table "course" {
  schema = schema.public
  comment = "课程基本信息表：记录全校课程的基础元数据"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "course_code" {
    null = false
    type = character_varying(50)
    comment = "课程代码（唯一）"
  }
  column "course_name" {
    null = false
    type = character_varying(255)
    comment = "课程名称"
  }
  column "semester" {
    null = false
    type = integer
    comment = "学期"
  }
  column "academic_year" {
    null = false
    type = integer
    comment = "学年"
  }
  column "available_majors" {
    null = true
    type = jsonb
    comment = "适用专业"
  }
  column "description" {
    null = true
    type = text
    comment = "课程描述"
  }
  column "credit" {
    null = false
    type = numeric(3, 1)
    default = 0
    comment = "学分"
  }
  column "department" {
    null = true
    type = character_varying(255)
    comment = "开课单位"
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
  unique "course_code_key" {
    columns = [column.course_code]
  }
}
