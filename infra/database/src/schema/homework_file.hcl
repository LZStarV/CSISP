table "homework_file" {
  schema = schema.public
  comment = "作业附件表：存储作业发布或提交相关的附件信息"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "target_type" {
    null = false
    type = character_varying(50)
    comment = "关联目标类型（homework/submission）"
  }
  column "target_id" {
    null = false
    type = integer
    comment = "关联目标 ID"
  }
  column "file_name" {
    null = false
    type = character_varying(255)
    comment = "原始文件名"
  }
  column "file_path" {
    null = false
    type = character_varying(512)
    comment = "存储系统路径"
  }
  column "file_size" {
    null = false
    type = bigint
    comment = "文件大小（字节）"
  }
  column "mime_type" {
    null = true
    type = character_varying(100)
    comment = "文件 MIME 类型"
  }
  column "created_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "创建时间"
  }
  primary_key {
    columns = [column.id]
  }
}
