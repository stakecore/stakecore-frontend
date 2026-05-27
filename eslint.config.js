import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // Global ignores: a config block with only `ignores` applies to every file.
  // Build artifacts and minified vendor output should never be linted.
  { ignores: ['dist/**', 'node_modules/**', '**/*.min.js'] },

  // Application source (browser + JSX).
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Node-environment config files (vite, postcss, etc.) — they need __dirname,
  // process, module, require, etc., which aren't in the browser globals set.
  {
    files: ['vite.config.js', '*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]
