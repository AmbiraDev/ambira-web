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
  // Jest test configuration
  {
    files: ['src/__tests__/**/*.{ts,tsx}', 'jest.setup.ts'],
    rules: {
      // Jest setup files legitimately use 'any' for global mocks
      '@typescript-eslint/no-explicit-any': 'off',
      // Test files often have unused imports for test utilities
      '@typescript-eslint/no-unused-vars': 'off',
      // Tests often assign values that look unused but are needed for test isolation
      'prefer-const': 'warn',
      // React test utilities create display-less components
      'react/display-name': 'off',
      // Test files often use require for dynamic test data
      '@typescript-eslint/no-require-imports': 'warn',
      // Test files use <img> for testing purposes, not for actual rendering
      '@next/next/no-img-element': 'off',
    },
  },
  // Playwright E2E tests
  {
    files: ['e2e/**/*.{ts,tsx}'],
    rules: {
      // Playwright's `use` function is not a React hook
      'react-hooks/rules-of-hooks': 'off',
      // E2E tests use 'any' for Playwright page interactions
      '@typescript-eslint/no-explicit-any': 'off',
      // E2E test files often have unused imports
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
];

export default eslintConfig;
