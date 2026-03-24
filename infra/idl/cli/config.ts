/**
 * 模块配置类型
 * - name：模块名称（如 backoffice/backend/idp 或 single）
 * - source：Thrift 源目录（src/<module> 或外部目录）
 * - tsOut：TS 生成输出目录（.generated/ts/<module>）
 */
export type ModuleConfig = {
  name: string;
  source: string;
  tsOut: string;
};

/**
 * CLI 配置类型
 * - modules：模块数组
 */
export type Config = {
  modules: ModuleConfig[];
};

/** 默认模块枚举（按约定扫描） */
export const DEFAULT_MODULES = ['backoffice', 'backend', 'idp'] as const;
export type ModuleName = (typeof DEFAULT_MODULES)[number];

/** 环境变量键名（用于覆盖约定） */
export const ENV_KEYS = {
  IDL_SOURCE_DIR: 'IDL_SOURCE_DIR',
} as const;

/** 配置文件路径（可选） */
export const CONFIG_DIRNAME = 'config';
export const CONFIG_FILENAME = 'config.json';

/**
 * 加载 CLI 配置
 * 约定与环境变量构造：
 * - IDL_SOURCE_DIR：指定单模块源；否则扫描 backoffice/backend/idp
 * - TS_OUT_DIR：覆盖输出目录（仅在单模块模式时使用）
 */
export function loadConfig(): Config {
  const sourceDir = process.env[ENV_KEYS.IDL_SOURCE_DIR] ?? '';
  const tsOutDir = '';
  const modules: ModuleConfig[] = [];
  if (sourceDir) {
    const name = 'single';
    modules.push({
      name,
      source: sourceDir,
      tsOut: tsOutDir || `.generated/${name}`,
    });
  } else {
    for (const name of DEFAULT_MODULES) {
      modules.push({
        name,
        source: `src/${name}`,
        tsOut: `.generated/${name}`,
      });
    }
  }
  return { modules };
}
