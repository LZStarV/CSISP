import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
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
    ],
  },
  {
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
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          trailingComma: 'es5',
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          bracketSpacing: true,
          arrowParens: 'avoid',
          endOfLine: 'lf',
        },
      ],
      semi: ['error', 'always'],
      'no-unused-vars': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
  },
  {
    files: ['apps/backend/scripts/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
    },
  },
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: ['./tsconfig.json', './tsconfig.node.json'],
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-model-argument': 'off',
      'vue/script-setup-no-uses-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // 明确为Vue文件关闭any检查
    },
  },
];
