/**
 * CSISP Backend Application Entry Point
 * 主要功能：
 * - 初始化Koa应用
 * - 配置中间件栈
 * - 设置路由
 * - 启动服务器
 */

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from '@koa/router';
import swaggerJsdoc from 'swagger-jsdoc';
import { koaSwagger } from 'koa2-swagger-ui';

// 导入自定义中间件
import { errorHandler, logger, rateLimit, defaultCors } from './src/middlewares';

// 导入路由配置与控制器初始化
import { initializeControllers } from './src/initControllers';
import { RouterConfig } from './src/controllers/RouterConfig';

// 创建Koa应用实例
const app = new (Koa as any)();

// 创建路由实例
const router = new Router();

// 环境配置
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 使用统一控制器与路由配置（ServiceFactory + Sequelize 模型注册）

/**
 * 配置全局中间件
 */
function setupGlobalMiddleware() {
  // 错误处理中间件（必须第一个）
  app.use(
    errorHandler({
      showDetailsInDev: NODE_ENV === 'development',
      logErrors: true,
    })
  );

  // CORS中间件
  app.use(defaultCors);

  // 日志中间件
  app.use(
    logger({
      logBody: NODE_ENV === 'development',
      excludePaths: ['/health', '/favicon.ico'],
    })
  );

  // 速率限制中间件
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 每个IP最多1000次请求
      excludePaths: ['/health'],
    })
  );

  // 请求体解析中间件
  app.use(
    bodyParser({
      enableTypes: ['json', 'form'],
      jsonLimit: '10mb',
      formLimit: '10mb',
    })
  );
}

/**
 * 配置路由
 */
function setupRoutes(controllers: RouterConfig) {
  // 从控制器配置获取统一 API 路由
  const apiRouter = controllers.getRouter();
  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());

  // 根路由
  router.get('/', (ctx: any) => {
    ctx.body = {
      message: 'Welcome to CSISP Backend API',
      version: '1.0.0',
      environment: NODE_ENV,
      endpoints: {
        api: '/api',
      },
    };
  });

  // Swagger/OpenAPI 配置
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'CSISP Backend API',
      version: '1.0.0',
      description: '计算机学院综合服务平台后端接口文档',
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Local Dev' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            data: {},
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            errors: { type: 'object', additionalProperties: { type: 'string' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            size: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
          },
        },
        Status: {
          type: 'integer',
          enum: [0, 1],
          description: '0=Inactive,1=Active',
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            realName: { type: 'string' },
            studentId: { type: 'string' },
            enrollmentYear: { type: 'integer' },
            major: { type: 'string' },
            status: { $ref: '#/components/schemas/Status' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            courseName: { type: 'string' },
            courseCode: { type: 'string' },
            semester: { type: 'integer' },
            academicYear: { type: 'integer' },
            availableMajors: { type: 'array', items: { type: 'string' } },
            status: { $ref: '#/components/schemas/Status' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            className: { type: 'string' },
            courseId: { type: 'integer' },
            teacherId: { type: 'integer' },
            semester: { type: 'integer' },
            academicYear: { type: 'integer' },
            maxStudents: { type: 'integer' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        SubCourse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            courseId: { type: 'integer' },
            subCourseCode: { type: 'string' },
            teacherId: { type: 'integer' },
            academicYear: { type: 'integer' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        TimeSlot: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            subCourseId: { type: 'integer' },
            weekday: { type: 'integer', minimum: 1, maximum: 7 },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            location: { type: 'string' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        AttendanceTaskEntity: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            classId: { type: 'integer' },
            taskName: { type: 'string' },
            taskType: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        AttendanceRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            attendanceTaskId: { type: 'integer' },
            userId: { type: 'integer' },
            status: { type: 'string' },
            remark: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Homework: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            classId: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            deadline: { type: 'string', format: 'date-time' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        HomeworkSubmission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            homeworkId: { type: 'integer' },
            userId: { type: 'integer' },
            content: { type: 'string' },
            fileUrl: { type: 'string' },
            score: { type: 'integer' },
            feedback: { type: 'string' },
            status: { $ref: '#/components/schemas/Status' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        HomeworkFile: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            submissionId: { type: 'integer' },
            fileName: { type: 'string' },
            filePath: { type: 'string' },
            fileSize: { type: 'integer' },
            fileType: { type: 'string' },
            uploadTime: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedUserList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            size: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        PaginatedCourseList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Course' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            size: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        PaginatedAttendanceTaskList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/AttendanceTaskEntity' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            size: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        PaginatedAttendanceRecordList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/AttendanceRecord' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            size: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        PaginatedHomeworkSubmissionList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/HomeworkSubmission' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            size: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        CreateUserInput: {
          type: 'object',
          required: ['username', 'password', 'realName', 'studentId', 'enrollmentYear', 'major'],
          properties: {
            username: { type: 'string', minLength: 3 },
            password: { type: 'string', minLength: 8 },
            realName: { type: 'string' },
            studentId: { type: 'string', minLength: 11, maxLength: 11 },
            enrollmentYear: { type: 'integer', minimum: 2000, maximum: 3000 },
            major: { type: 'string' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        LoginParams: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        CreateCourseInput: {
          type: 'object',
          required: ['courseName', 'courseCode', 'semester', 'academicYear', 'availableMajors'],
          properties: {
            courseName: { type: 'string' },
            courseCode: { type: 'string' },
            semester: { type: 'integer', minimum: 1, maximum: 8 },
            academicYear: { type: 'integer' },
            availableMajors: { type: 'array', items: { type: 'string' } },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        CreateClassInput: {
          type: 'object',
          required: [
            'className',
            'courseId',
            'teacherId',
            'semester',
            'academicYear',
            'maxStudents',
          ],
          properties: {
            className: { type: 'string' },
            courseId: { type: 'integer', minimum: 1 },
            teacherId: { type: 'integer', minimum: 1 },
            semester: { type: 'integer', minimum: 1, maximum: 8 },
            academicYear: { type: 'integer' },
            maxStudents: { type: 'integer', minimum: 1 },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        CreateTimeSlotInput: {
          type: 'object',
          required: ['subCourseId', 'weekday', 'startTime', 'endTime', 'location'],
          properties: {
            subCourseId: { type: 'integer', minimum: 1 },
            weekday: { type: 'integer', minimum: 1, maximum: 7 },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            location: { type: 'string' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        CreateSubCourseInput: {
          type: 'object',
          required: ['courseId', 'subCourseCode', 'teacherId', 'academicYear'],
          properties: {
            courseId: { type: 'integer', minimum: 1 },
            subCourseCode: { type: 'string' },
            teacherId: { type: 'integer', minimum: 1 },
            academicYear: { type: 'integer' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        AttendanceTask: {
          type: 'object',
          properties: {
            classId: { type: 'integer', minimum: 1 },
            taskName: { type: 'string' },
            taskType: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        CreateHomeworkInput: {
          type: 'object',
          required: ['classId', 'title', 'content', 'deadline'],
          properties: {
            classId: { type: 'integer', minimum: 1 },
            title: { type: 'string' },
            content: { type: 'string' },
            deadline: { type: 'string', format: 'date-time' },
            status: { $ref: '#/components/schemas/Status' },
          },
        },
        CreateHomeworkSubmissionInput: {
          type: 'object',
          required: ['homeworkId', 'userId'],
          properties: {
            homeworkId: { type: 'integer', minimum: 1 },
            userId: { type: 'integer', minimum: 1 },
            content: { type: 'string' },
          },
        },
      },
    },
  } as const;

  const swaggerOptions = {
    definition: swaggerDefinition,
    apis: ['./src/controllers/*.ts', './src/routes/*.ts', './app.ts'],
  } as any;
  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // 提供 swagger.json
  router.get('/swagger.json', (ctx: any) => {
    ctx.set('Content-Type', 'application/json');
    ctx.body = swaggerSpec;
  });

  // 提供 Swagger UI
  app.use(
    koaSwagger({
      routePrefix: '/docs',
      swaggerOptions: {
        url: '/swagger.json',
      },
    })
  );

  // 应用路由
  app.use(router.routes());
  app.use(router.allowedMethods());
}

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 初始化控制器与路由
    const controllers = await initializeControllers();

    // 配置中间件
    setupGlobalMiddleware();

    // 配置路由
    setupRoutes(controllers);

    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      process.stdout.write(
        `\x1b[36m[CSISP]\x1b[0m 🚀 Server started · \x1b[1mPort\x1b[0m=${PORT} · \x1b[1mEnv\x1b[0m=${NODE_ENV} · \x1b[1mPID\x1b[0m=${process.pid}\n`
      );
    });

    // 优雅关闭处理
    const gracefulShutdown = (signal: string) => {
      process.stdout.write(`\x1b[36m[CSISP]\x1b[0m ⏹️  Shutdown signal received: ${signal}\n`);

      server.close(() => {
        process.stdout.write('\x1b[36m[CSISP]\x1b[0m 🔌 Server closed\n');

        // 这里可以添加数据库连接关闭等清理操作

        process.stdout.write('\x1b[36m[CSISP]\x1b[0m 🔌 Shutdown done\n');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        process.stderr.write('\x1b[36m[CSISP]\x1b[0m 🔌 Force shutdown timeout\n');
        process.exit(1);
      }, 10000);
    };

    // 监听系统信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获异常处理
    process.on('uncaughtException', () => {
      process.stderr.write('uncaught_exception\n');
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', () => {
      process.stderr.write('unhandled_rejection\n');
      gracefulShutdown('unhandledRejection');
    });
  } catch {
    process.stderr.write('failed_start_server\n');
    process.exit(1);
  }
}

// 启动应用
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };
