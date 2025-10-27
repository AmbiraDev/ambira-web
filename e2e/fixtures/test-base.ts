import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Extended test fixtures with accessibility testing utilities
 */
type TestFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

/**
 * Extended test with accessibility scanning fixture
 */
export const test = base.extend<TestFixtures>({
  /**
   * Automatic accessibility scanning for each test
   * Usage: test('my test', async ({ page, makeAxeBuilder }) => { ... })
   */
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        // Exclude third-party content from accessibility scans
        .exclude('#third-party-widget')
        // Set options for the scan
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

    await use(makeAxeBuilder);
  },
});

export { expect } from '@playwright/test';
