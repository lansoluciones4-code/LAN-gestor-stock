import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'jsx-quotes': ['error', 'prefer-single'],
      quotes: ['error', 'single'],
      'space-before-blocks': ['error', 'always'],
      'space-before-function-paren': ['error', 'never'],
      semi: ['error', 'always'],
      'react/jsx-one-expression-per-line': ['error', { allow: 'none' }],
    },
  },
  globalIgnores(['.next/', 'node_modules/', 'dist/', '.github/']),
]);

export default eslintConfig;
