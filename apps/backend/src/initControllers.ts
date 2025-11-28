/**
 * 控制器初始化模块
 * 负责初始化所有服务、控制器和路由配置
 */

import models, { modelsReady } from './databases';
import { ServiceFactory } from './services/ServiceFactory';
import { RouterConfig } from './controllers/RouterConfig';
import {
  UserController,
  CourseController,
  AttendanceController,
  HomeworkController,
} from './controllers';

/**
 * 初始化控制器和路由
 * 创建所有服务实例、控制器实例，并配置路由
 * @returns 路由配置实例
 */
export async function initializeControllers(): Promise<RouterConfig> {
  // 获取服务工厂实例
  const serviceFactory = ServiceFactory.getInstance();

  await modelsReady;
  // 注册所有模型
  serviceFactory.registerModels(models);

  // 获取所有服务实例
  const services = serviceFactory.getAllServices();

  // 创建控制器实例
  const userController = new UserController(services.userService);
  const courseController = new CourseController(services.courseService);
  const attendanceController = new AttendanceController(services.attendanceService);
  const homeworkController = new HomeworkController(services.homeworkService);

  // 创建路由配置
  const routerConfig = new RouterConfig(
    userController,
    courseController,
    attendanceController,
    homeworkController
  );

  return routerConfig;
}

/**
 * 获取路由信息（用于调试和文档生成）
 * @returns 路由信息数组
 */
export async function getRoutesInfo() {
  const routerConfig = await initializeControllers();
  return routerConfig.getRoutesInfo();
}

/**
 * 清理资源
 * 在应用关闭时清理服务和模型实例
 */
export function cleanupControllers(): void {
  const serviceFactory = ServiceFactory.getInstance();
  serviceFactory.reset();
}
