/**
 * Test Providers for Integration Tests
 *
 * Wraps components with all necessary providers for integration testing:
 * - QueryClientProvider (React Query)
 * - AuthProvider (if needed)
 * - Mock router context
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/**
 * Creates a fresh QueryClient for each test
 * Disables retries and sets shorter timeouts for faster test execution
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Test wrapper that provides all necessary context providers
 */
interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function TestProviders({
  children,
  queryClient: providedQueryClient,
  initialRoute = '/',
}: TestProvidersProps) {
  const queryClient = providedQueryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with test providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient,
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const testQueryClient = queryClient || createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TestProviders queryClient={testQueryClient} initialRoute={initialRoute}>
        {children}
      </TestProviders>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: testQueryClient,
  };
}

/**
 * Mock router push/replace functions for testing navigation
 */
export const mockRouterPush = jest.fn();
export const mockRouterReplace = jest.fn();
export const mockRouterBack = jest.fn();
export const mockRouterRefresh = jest.fn();

/**
 * Reset all router mocks
 */
export function resetRouterMocks() {
  mockRouterPush.mockClear();
  mockRouterReplace.mockClear();
  mockRouterBack.mockClear();
  mockRouterRefresh.mockClear();
}

/**
 * Creates a mock router with custom pathname and search params
 */
export function createMockRouter(
  pathname: string = '/',
  searchParams: Record<string, string> = {}
) {
  const mockRouter = {
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: mockRouterBack,
    forward: jest.fn(),
    refresh: mockRouterRefresh,
    prefetch: jest.fn(),
  };

  const mockPathname = pathname;
  const mockSearchParamsInstance = new URLSearchParams(searchParams);

  // Mock the Next.js navigation hooks
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (usePathname as jest.Mock).mockReturnValue(mockPathname);
  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParamsInstance);

  return mockRouter;
}
