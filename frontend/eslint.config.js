import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Chrome extension messaging (StepInstallExtension.jsx)
        ...globals.webextensions,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // localStorage is touched ONLY by utils/session.js — direct access,
      // including window.localStorage, is a build error.
      'no-restricted-syntax': ['error',
        {
          selector: "CallExpression[callee.object.name='localStorage']",
          message: 'Use utils/session.js instead of direct localStorage access.',
        },
        {
          selector: "CallExpression[callee.object.object.name='window'][callee.object.property.name='localStorage']",
          message: 'Use utils/session.js instead of direct localStorage access.',
        },
      ],
      // Accessibility violations — Phase 7 remediates these; warn until then
      ...Object.fromEntries(
        Object.entries(jsxA11y.configs.recommended.rules).map(([rule]) => [rule, 'warn'])
      ),
      // Deprecated by jsx-a11y in favour of label-has-associated-control; keeping
      // it double-reports every label. Off, not suppressed.
      'jsx-a11y/label-has-for': 'off',
      // React correctness rules that don't require prop-types
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unknown-property': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-deprecated': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
  {
    // Test files: vitest globals
    files: ['**/*.test.{js,jsx}', '**/test/setup.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      // Tests legitimately exercise raw storage (prototype spies, jsdom resets)
      'no-restricted-syntax': 'off',
    },
  },
])
