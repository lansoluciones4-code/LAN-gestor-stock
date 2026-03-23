import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'jsx-quotes': ['error', 'prefer-single'],
      'quotes': ['error', 'single']
    }
  },
  globalIgnores([
    '.next/',
    'node_modules/',
    'dist/'
  ])
]);

export default eslintConfig;
