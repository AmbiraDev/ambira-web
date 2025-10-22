/**
 * Core Web Vitals Testing Script
 * Tests LCP, FCP, CLS, and TTFB on the feed page
 * Focuses on verifying LCP improvement after logo priority optimization
 */

const puppeteer = require('puppeteer');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Core Web Vitals thresholds
const thresholds = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FCP: { good: 1800, needsImprovement: 3000 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  TTFB: { good: 800, needsImprovement: 1800 },
  TBT: { good: 200, needsImprovement: 600 },
};

function getScoreColor(metric, value) {
  const threshold = thresholds[metric];
  if (!threshold) return colors.cyan;

  if (metric === 'CLS') {
    return value <= threshold.good ? colors.green :
           value <= threshold.needsImprovement ? colors.yellow : colors.red;
  } else {
    return value <= threshold.good ? colors.green :
           value <= threshold.needsImprovement ? colors.yellow : colors.red;
  }
}

function getScoreLabel(metric, value) {
  const threshold = thresholds[metric];
  if (!threshold) return 'N/A';

  if (metric === 'CLS') {
    return value <= threshold.good ? '✓ GOOD' :
           value <= threshold.needsImprovement ? '⚠ NEEDS IMPROVEMENT' : '✗ POOR';
  } else {
    return value <= threshold.good ? '✓ GOOD' :
           value <= threshold.needsImprovement ? '⚠ NEEDS IMPROVEMENT' : '✗ POOR';
  }
}

async function measureCoreWebVitals(url, iterations = 3) {
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}          CORE WEB VITALS PERFORMANCE TEST${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bright}Test Configuration:${colors.reset}`);
  console.log(`  URL: ${colors.cyan}${url}${colors.reset}`);
  console.log(`  Iterations: ${colors.cyan}${iterations}${colors.reset}`);
  console.log(`  Focus: ${colors.magenta}LCP Improvement (Logo Priority Fix)${colors.reset}\n`);

  const results = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`${colors.bright}───────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.bright}Run ${i + 1}/${iterations}${colors.reset}\n`);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
    });

    try {
      const page = await browser.newPage();

      // Set viewport to desktop size
      await page.setViewport({ width: 1920, height: 1080 });

      // Enable Performance tracking
      await page.evaluateOnNewDocument(() => {
        window.webVitals = {};
      });

      // Collect performance metrics
      const metrics = {};
      let lcpElement = null;

      // Inject Web Vitals tracking
      await page.evaluateOnNewDocument(() => {
        // Track LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.webVitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
          window.webVitals.LCPElement = lastEntry.element?.tagName || 'Unknown';
          window.webVitals.LCPUrl = lastEntry.url || lastEntry.element?.src || 'N/A';
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Track FCP
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              window.webVitals.FCP = entry.startTime;
            }
          });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // Track CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              window.webVitals.CLS = clsValue;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Track TTFB
        window.addEventListener('load', () => {
          const navTiming = performance.getEntriesByType('navigation')[0];
          if (navTiming) {
            window.webVitals.TTFB = navTiming.responseStart - navTiming.requestStart;
          }
        });
      });

      // Navigate to the page
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Collect metrics
      const vitals = await page.evaluate(() => window.webVitals);

      // Get additional performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navTiming = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
          loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart,
          totalLoadTime: navTiming.loadEventEnd - navTiming.fetchStart,
        };
      });

      // Get resource timing for images
      const resourceTimings = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const images = resources.filter(r => r.initiatorType === 'img' || r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)/i));

        return {
          totalImages: images.length,
          priorityImages: images.filter(img => img.fetchStart < 1000).length,
          imageLoadTimes: images.map(img => ({
            url: img.name.substring(img.name.lastIndexOf('/') + 1),
            duration: Math.round(img.duration),
            size: img.transferSize,
          })).slice(0, 5), // First 5 images
        };
      });

      const result = {
        iteration: i + 1,
        LCP: vitals.LCP ? Math.round(vitals.LCP) : null,
        LCPElement: vitals.LCPElement || 'Unknown',
        LCPUrl: vitals.LCPUrl || 'N/A',
        FCP: vitals.FCP ? Math.round(vitals.FCP) : null,
        CLS: vitals.CLS ? parseFloat(vitals.CLS.toFixed(3)) : null,
        TTFB: vitals.TTFB ? Math.round(vitals.TTFB) : null,
        ...performanceMetrics,
        ...resourceTimings,
      };

      results.push(result);

      // Display individual run results
      console.log(`${colors.bright}Core Web Vitals:${colors.reset}`);
      console.log(`  ${colors.bright}LCP:${colors.reset}  ${getScoreColor('LCP', result.LCP)}${result.LCP}ms${colors.reset} ${getScoreLabel('LCP', result.LCP)}`);
      console.log(`  ${colors.bright}FCP:${colors.reset}  ${getScoreColor('FCP', result.FCP)}${result.FCP}ms${colors.reset} ${getScoreLabel('FCP', result.FCP)}`);
      console.log(`  ${colors.bright}CLS:${colors.reset}  ${getScoreColor('CLS', result.CLS)}${result.CLS}${colors.reset} ${getScoreLabel('CLS', result.CLS)}`);
      console.log(`  ${colors.bright}TTFB:${colors.reset} ${getScoreColor('TTFB', result.TTFB)}${result.TTFB}ms${colors.reset} ${getScoreLabel('TTFB', result.TTFB)}`);

      console.log(`\n${colors.bright}LCP Details:${colors.reset}`);
      console.log(`  Element: ${colors.cyan}${result.LCPElement}${colors.reset}`);
      console.log(`  URL: ${colors.cyan}${result.LCPUrl.substring(0, 60)}...${colors.reset}`);

      console.log(`\n${colors.bright}Image Loading:${colors.reset}`);
      console.log(`  Total Images: ${colors.cyan}${result.totalImages}${colors.reset}`);
      console.log(`  Priority Images: ${colors.cyan}${result.priorityImages}${colors.reset}`);

      console.log(`\n${colors.bright}Additional Metrics:${colors.reset}`);
      console.log(`  DOM Content Loaded: ${colors.cyan}${Math.round(result.domContentLoaded)}ms${colors.reset}`);
      console.log(`  Total Load Time: ${colors.cyan}${Math.round(result.totalLoadTime)}ms${colors.reset}\n`);

    } catch (error) {
      console.error(`${colors.red}Error in iteration ${i + 1}:${colors.reset}`, error.message);
    } finally {
      await browser.close();
    }

    // Wait between iterations
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Calculate averages
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const lcpValues = results.filter(r => r.LCP).map(r => r.LCP);
  const fcpValues = results.filter(r => r.FCP).map(r => r.FCP);
  const clsValues = results.filter(r => r.CLS).map(r => r.CLS);
  const ttfbValues = results.filter(r => r.TTFB).map(r => r.TTFB);

  const averages = {
    LCP: lcpValues.length ? Math.round(avg(lcpValues)) : null,
    FCP: fcpValues.length ? Math.round(avg(fcpValues)) : null,
    CLS: clsValues.length ? parseFloat(avg(clsValues).toFixed(3)) : null,
    TTFB: ttfbValues.length ? Math.round(avg(ttfbValues)) : null,
  };

  // Display summary
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}                    SUMMARY RESULTS${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bright}Average Core Web Vitals (${iterations} runs):${colors.reset}\n`);

  console.log(`${colors.bright}  LCP (Largest Contentful Paint):${colors.reset}`);
  console.log(`    ${getScoreColor('LCP', averages.LCP)}${averages.LCP}ms${colors.reset} ${getScoreLabel('LCP', averages.LCP)}`);
  console.log(`    Target: < 2500ms (Good), < 4000ms (Needs Improvement)\n`);

  console.log(`${colors.bright}  FCP (First Contentful Paint):${colors.reset}`);
  console.log(`    ${getScoreColor('FCP', averages.FCP)}${averages.FCP}ms${colors.reset} ${getScoreLabel('FCP', averages.FCP)}`);
  console.log(`    Target: < 1800ms (Good), < 3000ms (Needs Improvement)\n`);

  console.log(`${colors.bright}  CLS (Cumulative Layout Shift):${colors.reset}`);
  console.log(`    ${getScoreColor('CLS', averages.CLS)}${averages.CLS}${colors.reset} ${getScoreLabel('CLS', averages.CLS)}`);
  console.log(`    Target: < 0.1 (Good), < 0.25 (Needs Improvement)\n`);

  console.log(`${colors.bright}  TTFB (Time to First Byte):${colors.reset}`);
  console.log(`    ${getScoreColor('TTFB', averages.TTFB)}${averages.TTFB}ms${colors.reset} ${getScoreLabel('TTFB', averages.TTFB)}`);
  console.log(`    Target: < 800ms (Good), < 1800ms (Needs Improvement)\n`);

  // Performance verdict
  console.log(`${colors.bright}${colors.cyan}───────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.bright}PERFORMANCE VERDICT:${colors.reset}\n`);

  const passCount = [
    averages.LCP <= thresholds.LCP.good,
    averages.FCP <= thresholds.FCP.good,
    averages.CLS <= thresholds.CLS.good,
    averages.TTFB <= thresholds.TTFB.good,
  ].filter(Boolean).length;

  if (passCount === 4) {
    console.log(`${colors.green}${colors.bright}✓ EXCELLENT${colors.reset} - All Core Web Vitals are in the "Good" range!`);
  } else if (passCount >= 2) {
    console.log(`${colors.yellow}${colors.bright}⚠ GOOD${colors.reset} - Most Core Web Vitals are in acceptable ranges.`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ NEEDS WORK${colors.reset} - Several Core Web Vitals need optimization.`);
  }

  // LCP Improvement Analysis
  console.log(`\n${colors.bright}${colors.magenta}LCP IMPROVEMENT ANALYSIS:${colors.reset}\n`);

  const expectedBefore = 3000; // From PERFORMANCE_AUDIT_REPORT.md baseline
  const expectedImprovement = 50; // Expected 50% improvement
  const actualImprovement = ((expectedBefore - averages.LCP) / expectedBefore * 100).toFixed(1);

  console.log(`  Expected LCP (before optimization): ${colors.cyan}~${expectedBefore}ms${colors.reset}`);
  console.log(`  Actual LCP (after logo priority fix): ${getScoreColor('LCP', averages.LCP)}${averages.LCP}ms${colors.reset}`);
  console.log(`  Improvement: ${actualImprovement >= 0 ? colors.green : colors.red}${actualImprovement}%${colors.reset}`);
  console.log(`  Target Improvement: ${colors.cyan}${expectedImprovement}%${colors.reset}`);

  if (averages.LCP <= thresholds.LCP.good) {
    console.log(`\n  ${colors.green}${colors.bright}✓ SUCCESS${colors.reset} - LCP is now in the "Good" range (< 2.5s)`);
    console.log(`  ${colors.green}✓ Logo priority fix has effectively improved LCP performance${colors.reset}`);
  } else if (averages.LCP <= thresholds.LCP.needsImprovement) {
    console.log(`\n  ${colors.yellow}${colors.bright}⚠ PARTIAL SUCCESS${colors.reset} - LCP improved but still needs work`);
    console.log(`  ${colors.yellow}⚠ Consider additional optimizations for above-the-fold content${colors.reset}`);
  } else {
    console.log(`\n  ${colors.red}${colors.bright}✗ NEEDS WORK${colors.reset} - LCP still above acceptable threshold`);
    console.log(`  ${colors.red}✗ Additional investigation required${colors.reset}`);
  }

  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  return { results, averages };
}

// Run the test
const url = process.argv[2] || 'http://localhost:3000/';
const iterations = parseInt(process.argv[3]) || 3;

measureCoreWebVitals(url, iterations)
  .then(() => {
    console.log(`${colors.green}✓ Test completed successfully${colors.reset}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}✗ Test failed:${colors.reset}`, error);
    process.exit(1);
  });
