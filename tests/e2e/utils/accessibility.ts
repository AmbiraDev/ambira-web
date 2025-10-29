import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Run accessibility scan on the current page
 * @param page - Playwright page instance
 * @param options - Optional configuration for axe scan
 * @returns Axe results
 */
export async function runAccessibilityScan(
  page: Page,
  options?: {
    exclude?: string[];
    disableRules?: string[];
  }
) {
  const builder = new AxeBuilder({ page });

  // Exclude specific selectors if provided
  if (options?.exclude) {
    options.exclude.forEach((selector) => {
      builder.exclude(selector);
    });
  }

  // Disable specific rules if provided
  if (options?.disableRules) {
    builder.disableRules(options.disableRules);
  }

  // Run the accessibility scan
  const results = await builder.analyze();

  return results;
}

/**
 * Format accessibility violations for readable error messages
 * @param violations - Array of axe violations
 * @returns Formatted string with violation details
 */
export function formatA11yViolations(violations: any[]): string {
  if (violations.length === 0) {
    return 'No accessibility violations found';
  }

  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node: any) => {
          const target = node.target.join(', ');
          const html = node.html.substring(0, 100);
          return `    Target: ${target}\n    HTML: ${html}${node.html.length > 100 ? '...' : ''}`;
        })
        .join('\n\n');

      return `
[${violation.impact.toUpperCase()}] ${violation.id}: ${violation.help}
  Description: ${violation.description}
  WCAG: ${violation.tags.filter((tag: string) => tag.startsWith('wcag')).join(', ')}
  Affected elements (${violation.nodes.length}):
${nodes}
  Learn more: ${violation.helpUrl}
`;
    })
    .join('\n' + '='.repeat(80) + '\n');
}

/**
 * Check for specific accessibility requirements
 * @param page - Playwright page instance
 */
export async function checkBasicAccessibility(page: Page) {
  const checks = {
    hasTitle: false,
    hasMainLandmark: false,
    hasHeadings: false,
    hasSkipLink: false,
  };

  // Check for page title
  const title = await page.title();
  checks.hasTitle = title.length > 0;

  // Check for main landmark
  const mainLandmark = await page.locator('main, [role="main"]').count();
  checks.hasMainLandmark = mainLandmark > 0;

  // Check for heading structure
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  checks.hasHeadings = headings > 0;

  // Check for skip link
  const skipLink = await page.locator('a[href="#main"], a[href="#content"]').count();
  checks.hasSkipLink = skipLink > 0;

  return checks;
}
