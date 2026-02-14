import pino, { type LoggerOptions } from 'pino';

const runtimeEnv = process.env.NODE_ENV || 'development';

/**
 * 日志创建选项
 */
export interface CreateLoggerOptions {
  /** 日志级别，默认从环境变量 LOG_LEVEL 读取，缺省为 'info' */
  level?: string;
  /** 是否为开发环境，默认根据 NODE_ENV === 'development' 判断 */
  isDev?: boolean;
  /** 自定义 pino 配置 */
  pinoOptions?: LoggerOptions;
}

/**
 * 创建标准化的 pino logger
 *
 * 规范：
 * 1. 生产环境：输出标准 JSON 到控制台。
 * 2. 开发环境：强制启用 pino-pretty 美化输出。
 *
 * @param service 服务名称
 * @param options 配置选项
 */
export function createLogger(
  service: string,
  options: CreateLoggerOptions = {}
) {
  const isDev = options.isDev ?? runtimeEnv === 'development';
  const level = (options.level ?? process.env.LOG_LEVEL) || 'info';

  const pinoOpts: LoggerOptions = {
    level,
    ...options.pinoOptions,
  };

  // 开发环境下启用 pino-pretty
  if (isDev) {
    pinoOpts.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: true,
        ...options.pinoOptions?.transport?.options,
      },
    };
  }

  const logger = pino(pinoOpts);

  // 统一注入基础字段
  return logger.child({ service, env: runtimeEnv });
}
