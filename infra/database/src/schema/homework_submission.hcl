table "homework_submission" {
  schema = schema.public
  comment = "作业提交记录：学生提交作业的具体内容与评分"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "homework_id" {
    null = false
    type = integer
    comment = "关联作业 ID"
  }
  column "user_id" {
    null = false
    type = integer
    comment = "关联学生用户 ID"
  }
  column "content" {
    null = true
    type = text
    comment = "提交文本内容"
  }
  column "score" {
    null = true
    type = numeric(5, 2)
    comment = "作业评分"
  }
  column "comment" {
    null = true
    type = text
    comment = "教师评语"
  }
  column "status" {
    null    = false
    type    = integer
    default = 1
    comment = "状态（1 已提交，2 已批改）"
  }
  column "submitted_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "提交时间"
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
  foreign_key "homework_submission_homework_id_fkey" {
    columns     = [column.homework_id]
    ref_columns = [table.homework.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  foreign_key "homework_submission_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  unique "homework_submission_homework_id_user_id_uk" {
    columns = [column.homework_id, column.user_id]
  }
}
