#!/usr/bin/env node

/**
 * Create Feature CLI
 *
 * Scaffolds a new feature with the standardized React Query pattern.
 *
 * Usage:
 *   npm run create-feature <feature-name>
 *   npm run create-feature sessions
 *
 * Creates:
 *   src/features/<feature>/
 *     ├── services/<Feature>Service.ts
 *     ├── hooks/use<Feature>.ts
 *     ├── hooks/use<Feature>Mutations.ts
 *     ├── hooks/index.ts
 *     └── types/<feature>.types.ts (optional)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get feature name from command line
const featureName = process.argv[2];

if (!featureName) {
  console.error('❌ Error: Feature name is required');
  console.log('Usage: npm run create-feature <feature-name>');
  console.log('Example: npm run create-feature sessions');
  process.exit(1);
}

// Convert to different cases
const kebabCase = featureName.toLowerCase();
const PascalCase = featureName.charAt(0).toUpperCase() + featureName.slice(1);
const UPPER_SNAKE_CASE = featureName.toUpperCase();
const camelCase = featureName.charAt(0).toLowerCase() + featureName.slice(1);

// Define paths
const featureDir = path.join(__dirname, '..', 'src', 'features', kebabCase);
const servicesDir = path.join(featureDir, 'services');
const hooksDir = path.join(featureDir, 'hooks');
const typesDir = path.join(featureDir, 'types');

// Check if feature already exists
if (fs.existsSync(featureDir)) {
  console.error(`❌ Error: Feature '${kebabCase}' already exists at ${featureDir}`);
  process.exit(1);
}

// Create directories
console.log(`📁 Creating feature structure for '${kebabCase}'...`);
fs.mkdirSync(servicesDir, { recursive: true });
fs.mkdirSync(hooksDir, { recursive: true });
fs.mkdirSync(typesDir, { recursive: true });

// Template: Service
const serviceTemplate = `/**
 * ${PascalCase} Service - Business Logic Layer
 *
 * Orchestrates business workflows for ${kebabCase}.
 * No React dependencies - pure TypeScript for testability.
 */

import { ${PascalCase}Repository } from '@/infrastructure/firebase/repositories/${PascalCase}Repository';
import { ${PascalCase} } from '@/domain/entities/${PascalCase}';

export class ${PascalCase}Service {
  private readonly ${camelCase}Repo: ${PascalCase}Repository;

  constructor() {
    this.${camelCase}Repo = new ${PascalCase}Repository();
  }

  /**
   * Get ${kebabCase} by ID
   */
  async get${PascalCase}(id: string): Promise<${PascalCase} | null> {
    return this.${camelCase}Repo.findById(id);
  }

  /**
   * Get all ${kebabCase}s for a user
   */
  async getUser${PascalCase}s(userId: string, limit?: number): Promise<${PascalCase}[]> {
    return this.${camelCase}Repo.findByUserId(userId, limit);
  }

  /**
   * Create a new ${kebabCase}
   */
  async create${PascalCase}(data: Create${PascalCase}Data): Promise<${PascalCase}> {
    // Add business logic/validation here
    return this.${camelCase}Repo.create(data);
  }

  /**
   * Update a ${kebabCase}
   */
  async update${PascalCase}(id: string, data: Partial<${PascalCase}>): Promise<void> {
    // Add business logic/validation here
    return this.${camelCase}Repo.update(id, data);
  }

  /**
   * Delete a ${kebabCase}
   */
  async delete${PascalCase}(id: string): Promise<void> {
    return this.${camelCase}Repo.delete(id);
  }
}

// TODO: Define this type
export interface Create${PascalCase}Data {
  // Add fields here
}
`;

// Template: Query Hooks
const queryHooksTemplate = `/**
 * ${PascalCase} Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for ${kebabCase}.
 * All components should use these hooks instead of direct React Query or firebaseApi calls.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ${PascalCase}Service } from '../services/${PascalCase}Service';
import { ${PascalCase} } from '@/domain/entities/${PascalCase}';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

const ${camelCase}Service = new ${PascalCase}Service();

// ==================== CACHE KEYS ====================

export const ${UPPER_SNAKE_CASE}_KEYS = {
  all: () => ['${kebabCase}'] as const,
  lists: () => [...${UPPER_SNAKE_CASE}_KEYS.all(), 'list'] as const,
  list: (filters?: string) => [...${UPPER_SNAKE_CASE}_KEYS.lists(), { filters }] as const,
  details: () => [...${UPPER_SNAKE_CASE}_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...${UPPER_SNAKE_CASE}_KEYS.details(), id] as const,
  user${PascalCase}s: (userId: string) => [...${UPPER_SNAKE_CASE}_KEYS.all(), 'user', userId] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Get ${kebabCase} details by ID
 *
 * @example
 * const { data: ${camelCase}, isLoading, error } = use${PascalCase}Details(${camelCase}Id);
 */
export function use${PascalCase}Details(
  id: string,
  options?: Partial<UseQueryOptions<${PascalCase} | null, Error>>
) {
  return useQuery<${PascalCase} | null, Error>({
    queryKey: ${UPPER_SNAKE_CASE}_KEYS.detail(id),
    queryFn: () => ${camelCase}Service.get${PascalCase}(id),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!id,
    ...options,
  });
}

/**
 * Get all ${kebabCase}s for a user
 *
 * @example
 * const { data: ${camelCase}s, isLoading } = useUser${PascalCase}s(userId);
 */
export function useUser${PascalCase}s(
  userId: string,
  limit?: number,
  options?: Partial<UseQueryOptions<${PascalCase}[], Error>>
) {
  return useQuery<${PascalCase}[], Error>({
    queryKey: ${UPPER_SNAKE_CASE}_KEYS.user${PascalCase}s(userId),
    queryFn: () => ${camelCase}Service.getUser${PascalCase}s(userId, limit),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!userId,
    ...options,
  });
}
`;

// Template: Mutation Hooks
const mutationHooksTemplate = `/**
 * ${PascalCase} Mutation Hooks - React Query Boundary
 *
 * All write operations (create, update, delete) for ${kebabCase}.
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { ${PascalCase}Service, Create${PascalCase}Data } from '../services/${PascalCase}Service';
import { ${UPPER_SNAKE_CASE}_KEYS } from './use${PascalCase}';
import { ${PascalCase} } from '@/domain/entities/${PascalCase}';

const ${camelCase}Service = new ${PascalCase}Service();

/**
 * Create a new ${kebabCase}
 *
 * @example
 * const createMutation = useCreate${PascalCase}();
 * createMutation.mutate({ ...data });
 */
export function useCreate${PascalCase}(
  options?: Partial<UseMutationOptions<${PascalCase}, Error, Create${PascalCase}Data>>
) {
  const queryClient = useQueryClient();

  return useMutation<${PascalCase}, Error, Create${PascalCase}Data>({
    mutationFn: (data) => ${camelCase}Service.create${PascalCase}(data),

    onSuccess: (new${PascalCase}, variables) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ${UPPER_SNAKE_CASE}_KEYS.all() });
    },

    ...options,
  });
}

/**
 * Update a ${kebabCase}
 *
 * @example
 * const updateMutation = useUpdate${PascalCase}();
 * updateMutation.mutate({ id: '123', data: { ...updates } });
 */
export function useUpdate${PascalCase}(
  options?: Partial<UseMutationOptions<void, Error, { id: string; data: Partial<${PascalCase}> }>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; data: Partial<${PascalCase}> }>({
    mutationFn: ({ id, data }) => ${camelCase}Service.update${PascalCase}(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ${UPPER_SNAKE_CASE}_KEYS.detail(id) });

      // Snapshot previous value
      const previous = queryClient.getQueryData(${UPPER_SNAKE_CASE}_KEYS.detail(id));

      // Optimistically update
      queryClient.setQueryData(${UPPER_SNAKE_CASE}_KEYS.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previous };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(${UPPER_SNAKE_CASE}_KEYS.detail(id), context.previous);
      }
    },

    onSuccess: (_, { id }) => {
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ${UPPER_SNAKE_CASE}_KEYS.detail(id) });
    },

    ...options,
  });
}

/**
 * Delete a ${kebabCase}
 *
 * @example
 * const deleteMutation = useDelete${PascalCase}();
 * deleteMutation.mutate('${camelCase}-id');
 */
export function useDelete${PascalCase}(
  options?: Partial<UseMutationOptions<void, Error, string>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => ${camelCase}Service.delete${PascalCase}(id),

    onSuccess: (_, id) => {
      // Invalidate all ${kebabCase} queries
      queryClient.invalidateQueries({ queryKey: ${UPPER_SNAKE_CASE}_KEYS.all() });
    },

    ...options,
  });
}

/**
 * Helper hook to invalidate all ${kebabCase}-related queries
 *
 * @example
 * const invalidate${PascalCase}s = useInvalidate${PascalCase}s();
 * invalidate${PascalCase}s();
 */
export function useInvalidate${PascalCase}s() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ${UPPER_SNAKE_CASE}_KEYS.all() });
  };
}
`;

// Template: Index
const indexTemplate = `/**
 * ${PascalCase} Hooks - Public API
 *
 * All ${kebabCase}-related hooks exported from here.
 *
 * @example
 * import { use${PascalCase}Details, useCreate${PascalCase} } from '@/features/${kebabCase}/hooks';
 */

// Query hooks
export {
  use${PascalCase}Details,
  useUser${PascalCase}s,
  ${UPPER_SNAKE_CASE}_KEYS,
} from './use${PascalCase}';

// Mutation hooks
export {
  useCreate${PascalCase},
  useUpdate${PascalCase},
  useDelete${PascalCase},
  useInvalidate${PascalCase}s,
} from './use${PascalCase}Mutations';
`;

// Template: Types
const typesTemplate = `/**
 * ${PascalCase} Types
 *
 * Feature-specific types for ${kebabCase}.
 */

// Add feature-specific types here
export interface ${PascalCase}Filters {
  // Example filter fields
}

export interface ${PascalCase}Stats {
  // Example stats fields
}
`;

// Write files
console.log('📝 Writing files...');

fs.writeFileSync(path.join(servicesDir, `${PascalCase}Service.ts`), serviceTemplate);
console.log(`  ✅ Created ${PascalCase}Service.ts`);

fs.writeFileSync(path.join(hooksDir, `use${PascalCase}.ts`), queryHooksTemplate);
console.log(`  ✅ Created use${PascalCase}.ts`);

fs.writeFileSync(path.join(hooksDir, `use${PascalCase}Mutations.ts`), mutationHooksTemplate);
console.log(`  ✅ Created use${PascalCase}Mutations.ts`);

fs.writeFileSync(path.join(hooksDir, 'index.ts'), indexTemplate);
console.log(`  ✅ Created hooks/index.ts`);

fs.writeFileSync(path.join(typesDir, `${kebabCase}.types.ts`), typesTemplate);
console.log(`  ✅ Created ${kebabCase}.types.ts`);

// Create README
const readmeTemplate = `# ${PascalCase} Feature

This feature follows the standardized React Query pattern.

## Structure

\`\`\`
${kebabCase}/
├── services/${PascalCase}Service.ts      # Business logic (no React)
├── hooks/
│   ├── use${PascalCase}.ts               # Query hooks (React Query)
│   ├── use${PascalCase}Mutations.ts      # Mutation hooks (React Query)
│   └── index.ts                          # Public API
└── types/${kebabCase}.types.ts           # Feature-specific types
\`\`\`

## Usage

\`\`\`typescript
import { use${PascalCase}Details, useCreate${PascalCase} } from '@/features/${kebabCase}/hooks';

function ${PascalCase}Component({ id }: { id: string }) {
  const { data: ${camelCase}, isLoading } = use${PascalCase}Details(id);
  const createMutation = useCreate${PascalCase}();

  // ...
}
\`\`\`

## TODO

- [ ] Create ${PascalCase}Repository in \`src/infrastructure/firebase/repositories/\`
- [ ] Create ${PascalCase} entity in \`src/domain/entities/\`
- [ ] Implement service methods
- [ ] Add tests for service
- [ ] Add tests for hooks
- [ ] Update components to use new hooks
`;

fs.writeFileSync(path.join(featureDir, 'README.md'), readmeTemplate);
console.log(`  ✅ Created README.md`);

console.log('\n✨ Feature scaffolded successfully!\n');
console.log('📍 Location:', featureDir);
console.log('\n📋 Next steps:');
console.log(`  1. Create ${PascalCase}Repository in src/infrastructure/firebase/repositories/`);
console.log(`  2. Create ${PascalCase} entity in src/domain/entities/`);
console.log(`  3. Implement the service methods in ${PascalCase}Service.ts`);
console.log(`  4. Customize the hooks in use${PascalCase}.ts and use${PascalCase}Mutations.ts`);
console.log(`  5. Add tests for your service and hooks`);
console.log(`  6. Update components to use the new hooks`);
console.log('\n📖 See docs/architecture/EXAMPLES.md for complete examples');
