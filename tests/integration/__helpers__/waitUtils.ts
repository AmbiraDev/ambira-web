/**
 * Wait Utilities for Integration Tests
 *
 * Provides helper functions for waiting and timing in integration tests.
 */

 
// Note: 'any' types are acceptable in test utilities to support various query types

import { waitFor } from '@testing-library/react';

/**
 * Wait for React Query cache to be updated
 */
export async function waitForCacheUpdate(
  callback: () => any,
  options?: {
    timeout?: number;
    interval?: number;
  }
): Promise<void> {
  await waitFor(callback, {
    timeout: options?.timeout || 3000,
    interval: options?.interval || 50,
  });
}

/**
 * Wait for a query to be invalidated and refetch
 */
export async function waitForQueryInvalidation(
  queryClient: any,
  queryKey: any[],
  options?: { timeout?: number }
): Promise<void> {
  await waitFor(
    () => {
      const state = queryClient.getQueryState(queryKey);
      expect(state).toBeDefined();
      expect(state?.isInvalidated || state?.dataUpdatedAt).toBeTruthy();
    },
    { timeout: options?.timeout || 3000 }
  );
}

/**
 * Wait for a specific query to have data
 */
export async function waitForQueryData(
  queryClient: any,
  queryKey: any[],
  options?: { timeout?: number }
): Promise<void> {
  await waitFor(
    () => {
      const data = queryClient.getQueryData(queryKey);
      expect(data).toBeDefined();
    },
    { timeout: options?.timeout || 3000 }
  );
}

/**
 * Wait for mutation to complete
 */
export async function waitForMutation(
  mutationFn: () => Promise<any>,
  options?: { timeout?: number }
): Promise<void> {
  await waitFor(
    async () => {
      try {
        await mutationFn();
      } catch (error) {
        // Expected if mutation is still pending
        throw error;
      }
    },
    { timeout: options?.timeout || 3000 }
  );
}

/**
 * Wait for optimistic update to be applied
 */
export async function waitForOptimisticUpdate(
  queryClient: any,
  queryKey: any[],
  expectedValue: any,
  options?: { timeout?: number }
): Promise<void> {
  await waitFor(
    () => {
      const data = queryClient.getQueryData(queryKey);
      expect(data).toMatchObject(expectedValue);
    },
    { timeout: options?.timeout || 3000 }
  );
}

/**
 * Wait for network request to complete (mock)
 */
export async function waitForNetworkIdle(
  mockFn: jest.Mock,
  options?: { timeout?: number; expectedCalls?: number }
): Promise<void> {
  const expectedCalls = options?.expectedCalls || 1;

  await waitFor(
    () => {
      expect(mockFn).toHaveBeenCalledTimes(expectedCalls);
    },
    { timeout: options?.timeout || 3000 }
  );
}

/**
 * Delay execution for testing timing-sensitive operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for element to appear and be ready for interaction
 */
export async function waitForElement(
  callback: () => HTMLElement | null,
  options?: { timeout?: number }
): Promise<HTMLElement> {
  let element: HTMLElement | null = null;

  await waitFor(
    () => {
      element = callback();
      expect(element).toBeInTheDocument();
    },
    { timeout: options?.timeout || 3000 }
  );

  return element as HTMLElement;
}

/**
 * Wait for async state update
 */
export async function waitForStateUpdate(
  getState: () => any,
  expectedValue: any,
  options?: { timeout?: number }
): Promise<void> {
  await waitFor(
    () => {
      expect(getState()).toEqual(expectedValue);
    },
    { timeout: options?.timeout || 3000 }
  );
}
