import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  {
    // 全局忽略：第三方依赖、构建产物、缓存、锁文件、生成代码等
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.dist/**',
      '**/.output/**',
      '**/coverage/**',
      '**/.git/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/.turbo/**',
      '**/.cache/**',
      '**/.DS_Store',
      '**/*.log',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/migrations/**',
      '**/seeders/**',
      '**/cache/**',
      'apps/*/migrations/**',
      'apps/*/seeders/**',
      'apps/*/dist/**',
      'apps/*/build/**',
      'packages/*/dist/**',
      'packages/*/build/**',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**',
      'apps/backend-integrated/src/infra/postgres/generated/**',
      '**/.generated/**',
      'apps/backoffice/src/db/generated/**',
    ],
  },
  {
    // 基础规则：应用于所有 JS/TS/Vue 文件；启用 Prettier 校验与常用基础规则
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      // 使用 Prettier 强制格式（报错级别），保持与 .prettierrc 配置一致
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          trailingComma: 'es5',
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          bracketSpacing: true,
          arrowParens: 'avoid',
          endOfLine: 'lf',
        },
      ],
      // 语句结尾必须使用分号
      semi: ['error', 'always'],
      // 基础的未使用变量提示（TS 专区内会关闭并改用 TS 版本）
      'no-unused-vars': 'warn',
      // 控制台输出在生产环境报错，开发环境警告
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      // 最大嵌套深度控制
      'max-depth': ['warn', 5],
      // import 顺序与位置约束
      'import/first': 'warn',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    // 后端脚本：允许使用 console/debugger
    files: ['apps/backend/scripts/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
    },
  },
  // TypeScript 官方推荐规则集（flat configs）
  ...ts.configs.recommended,
  {
    // TypeScript 与 Vue 文件的专项解析与规则
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        // 适配 Monorepo：覆盖根目录与各子项目 tsconfig，保证类型信息完整
        project: [
          './tsconfig.json',
          './tsconfig.node.json',
          './apps/*/tsconfig.json',
          './apps/*/tsconfig.app.json',
          './apps/*/tsconfig.node.json',
          './packages/*/tsconfig.json',
          './infra/*/tsconfig.json',
          './infra/idl/tsconfig.json',
          './docs/tsconfig.json',
        ],
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      // 使用 TS 版本的未使用变量检查，并允许以下划线开头的占位参数
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      // 关闭基础版本的未使用变量，避免与 TS 版本重复
      'no-unused-vars': 'off',
      // 允许 any、边界类型显式声明（在本项目中按需使用）
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    // CommonJS 文件：关闭与 require 相关的 TS 规则
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'script',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  // Vue 官方基础规则（flat essential）
  ...vue.configs['flat/essential'],
  {
    // Vue 单文件组件（SFC）的专项解析与规则
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        // 同步 TS 解析范围，确保 <script lang="ts"> 能正确解析
        project: [
          './tsconfig.json',
          './tsconfig.node.json',
          './apps/*/tsconfig.json',
          './apps/*/tsconfig.app.json',
          './apps/*/tsconfig.node.json',
          './packages/*/tsconfig.json',
          './infra/*/tsconfig.json',
          './infra/idl/tsconfig.json',
          './docs/tsconfig.json',
        ],
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      // 允许单词组件名、允许 v-model 带参数、关闭 script-setup 未使用变量误报
      'vue/multi-word-component-names': 'off',
      'vue/no-v-model-argument': 'off',
      'vue/script-setup-uses-vars': 'off',
      // 在 Vue 文件中也关闭基础 no-unused-vars，使用 TS 版本的检查
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // 明确为Vue文件关闭any检查
    },
  },
  {
    // 测试文件覆盖：声明 Vitest 全局，关闭 console/debugger 限制
    files: ['**/*.{test,spec}.{js,mjs,cjs,ts,jsx,tsx}', 'tests/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
    },
  },
  {
    // Next.js 生成的类型文件：关闭三斜杠引用的校验（由 Next 自动生成）
    files: ['apps/backoffice/next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
];
