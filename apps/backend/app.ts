import Koa from 'koa'

const app = new Koa()

// 简单的中间件示例
app.use(async (ctx: any) => {
  ctx.body = 'Hello, CSISP Backend!'
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 CSISP Backend Server is running at http://localhost:${PORT}`)
})
