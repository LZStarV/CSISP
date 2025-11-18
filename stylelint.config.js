/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
  ],
  rules: {
    // 自定义规则
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'scss/at-rule-no-unknown': null,
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    'no-empty-source': null,
    'block-no-empty': null,
  },
  ignoreFiles: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
      rules: {
        // 允许Vue文件中的空style标签
        'no-empty-source': null,
        'block-no-empty': null,
      },
    },
  ],
};
