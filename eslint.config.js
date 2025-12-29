import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {},
    ignores: [
      '/src/setting.local.dist.js',
      '/src/setting.local.js',
    ],
    rules: {
      // recommended rules
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'no-cond-assign': 'off',
      'no-var': 'off',
      'no-case-declarations': 'off',
      'no-redeclare': 'off',
      indent: ['warn', 2, { SwitchCase: 1, ignoreComments: false }],
      'linebreak-style': ['warn', 'unix'],
      quotes: ['warn', 'single'],
      semi: ['warn', 'always'],
      'no-unreachable': 'warn',
      'no-class-assign': 'warn',
      'no-unused-vars': 'warn',
      'no-useless-escape': 'off',
      'no-irregular-whitespace': 'warn',
      'no-trailing-spaces': 'warn',
      'eol-last': 'error',
      'space-before-function-paren': ['warn', { named: 'never' }],
      'array-bracket-spacing': ['warn', 'never'],
      'object-curly-spacing': ['warn', 'always'],
      'spaced-comment': 'warn',
      'keyword-spacing': ['warn', { before: true }],
      'space-infix-ops': 'error',
      'key-spacing': ['error', { beforeColon: false }],
      'arrow-spacing': ['error', { before: true, after: true }],
      'comma-spacing': ['error', { before: false, after: true }],
      'one-var': ['error', 'never'],
      'brace-style': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-multi-spaces': 'warn',
      'no-duplicate-imports': 'warn',
    },
  },
];
