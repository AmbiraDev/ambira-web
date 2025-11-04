/**
 * ESLint Rules for React Query Feature Boundaries
 *
 * These rules enforce the standardized caching pattern:
 * - React Query only in feature hooks
 * - No direct firebaseApi in components
 * - Proper file organization
 *
 * To enable, merge these rules into your .eslintrc.js:
 * module.exports = {
 *   ...require('./.eslintrc.react-query-rules.js'),
 *   // ... rest of your config
 * };
 */

module.exports = {
  rules: {
    /**
     * Prevent direct firebaseApi imports in components
     */
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@/lib/firebaseApi',
            importNames: ['firebaseApi'],
            message:
              '❌ Direct firebaseApi usage not allowed in components. Use feature hooks instead: @/features/[feature]/hooks',
          },
          {
            name: '@/hooks/useCache',
            message:
              '⚠️ useCache is deprecated. Use feature-specific hooks instead: @/features/[feature]/hooks',
          },
          {
            name: '@/hooks/useMutations',
            message:
              '⚠️ useMutations is deprecated. Use feature-specific mutation hooks instead: @/features/[feature]/hooks/use[Feature]Mutations',
          },
        ],
      },
    ],
  },

  overrides: [
    /**
     * Components (src/app, src/components) cannot use React Query directly
     */
    {
      files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@tanstack/react-query',
                importNames: [
                  'useQuery',
                  'useMutation',
                  'useInfiniteQuery',
                  'useQueryClient',
                  'useSuspenseQuery',
                ],
                message:
                  '❌ React Query hooks not allowed in components. Use feature hooks instead: @/features/[feature]/hooks',
              },
              {
                name: '@/lib/firebaseApi',
                importNames: ['firebaseApi'],
                message:
                  '❌ Direct firebaseApi usage not allowed in components. Use feature hooks instead: @/features/[feature]/hooks',
              },
            ],
          },
        ],
      },
    },

    /**
     * Services (src/features/star/services) cannot use React or React Query
     */
    {
      files: ['src/features/**/services/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react',
                message:
                  '❌ React not allowed in services. Services must be pure TypeScript for testability.',
              },
              {
                name: '@tanstack/react-query',
                message:
                  '❌ React Query not allowed in services. Use in feature hooks instead.',
              },
            ],
            patterns: [
              {
                group: ['react-*', '@/hooks/*', '@/contexts/*'],
                message: '❌ React dependencies not allowed in services.',
              },
            ],
          },
        ],
      },
    },

    /**
     * Only feature hooks can use React Query
     */
    {
      files: ['src/**/*.{ts,tsx}'],
      excludedFiles: [
        'src/features/**/hooks/**/*.{ts,tsx}',
        'src/lib/react-query/**/*.{ts,tsx}',
        'src/app/layout.tsx', // QueryClientProvider
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@tanstack/react-query'],
                importNames: ['useQuery', 'useMutation', 'useInfiniteQuery'],
                message:
                  '❌ React Query hooks only allowed in src/features/*/hooks/*. Move this to a feature hook.',
              },
            ],
          },
        ],
      },
    },

    /**
     * Repositories should only use Firebase, not business logic
     */
    {
      files: ['src/infrastructure/firebase/repositories/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/features/**/services/*'],
                message:
                  '❌ Repositories should not import services. Keep dependencies one-way: Services → Repositories.',
              },
              {
                group: ['@/features/**/hooks/*'],
                message:
                  '❌ Repositories cannot import hooks. Repositories are at the data layer.',
              },
            ],
          },
        ],
      },
    },
  ],
};
