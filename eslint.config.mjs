import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { config, configs } from 'typescript-eslint';

export default config(
  eslint.configs.recommended,
  ...configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import/resolver': {
        // You will also need to install and configure the TypeScript resolver
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        typescript: {
          project: './tsconfig.json'
        },
        node: true
      }
    },
    rules: {
      'import/no-unresolved': ['error', { caseSensitive: true }],
      'import/named': 'error',
      'import/first': 'warn',
      'import/no-duplicates': 'error',
      'import/extensions': ['warn', 'always', { js: 'never', ts: 'never', json: 'always' }],
      'import/newline-after-import': 'warn',
      'import/order': [
        'warn',
        {
          'newlines-between': 'never',
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          named: true,
          alphabetize: {
            order: 'asc' /* sort in ascending order. Options: ['ignore', 'asc', 'desc'] */,
            caseInsensitive: true /* ignore case. Options: [true, false] */
          }
        }
      ]
    }
  }
);
