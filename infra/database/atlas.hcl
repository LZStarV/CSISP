env "local" {
  # 目标数据库连接（从环境变量读取）
  url = getenv("DATABASE_URL")

  # 开发/对比用数据库（Atlas 需要一个干净的库来计算 desired.hcl 的状态）
  dev = getenv("DEV_DATABASE_URL")

  # 迁移文件目录
  migration {
    dir = "file://infra/database/src/migrations"
  }

  # 期望的目标态定义目录
  schema {
    src = ["file://infra/database/src/schema/"]
  }

  # 定义 diff 时的默认行为
  diff {
    # 可以在这里添加一些忽略规则或特定的 diff 策略
  }
}
