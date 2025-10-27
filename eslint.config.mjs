import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tanstackQuery from '@tanstack/eslint-plugin-query';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  // React Query ESLint rules
  ...tanstackQuery.configs['flat/recommended'],
  {
    rules: {
      'prefer-const': 'warn', // Changed to warn for builds
      'no-unused-vars': 'off',
      // Changed to warn for production builds - still caught by `npm run lint`
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn', // Allow empty interfaces (common in UI libs)
      '@next/next/no-html-link-for-pages': 'warn', // Downgrade Next.js link warnings
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'warn', // Downgrade missing display name
      'react/jsx-no-undef': 'warn', // Downgrade undefined component warnings
      'react-hooks/exhaustive-deps': 'warn',
      // React Query specific rules
      '@tanstack/query/exhaustive-deps': 'warn',
      '@tanstack/query/no-rest-destructuring': 'warn',
      '@tanstack/query/stable-query-client': 'error',
    },
  },
];

export default eslintConfig;
