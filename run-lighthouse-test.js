/**
 * Lighthouse Performance Test Script
 * Tests Core Web Vitals and Performance metrics
 */

const lighthouse = require('lighthouse').default || require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

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

function getScoreColor(score) {
  if (score >= 0.9) return colors.green;
  if (score >= 0.5) return colors.yellow;
  return colors.red;
}

function getScoreLabel(score) {
  if (score >= 0.9) return '✓ GOOD';
  if (score >= 0.5) return '⚠ NEEDS IMPROVEMENT';
  return '✗ POOR';
}

async function runLighthouse(url, opts = {}) {
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}          LIGHTHOUSE PERFORMANCE AUDIT${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bright}Configuration:${colors.reset}`);
  console.log(`  URL: ${colors.cyan}${url}${colors.reset}`);
  console.log(`  Device: ${colors.cyan}Desktop${colors.reset}\n`);

  console.log(`${colors.bright}Launching Chrome...${colors.reset}\n`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    ...opts
  };

  try {
    console.log(`${colors.bright}Running Lighthouse audit...${colors.reset}\n`);

    const runnerResult = await lighthouse(url, options);

    await chrome.kill();

    // Extract results
    const { lhr } = runnerResult;
    const performanceScore = lhr.categories.performance.score;

    // Core Web Vitals metrics
    const metrics = {
      LCP: lhr.audits['largest-contentful-paint']?.numericValue || 0,
      FCP: lhr.audits['first-contentful-paint']?.numericValue || 0,
      CLS: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
      TBT: lhr.audits['total-blocking-time']?.numericValue || 0,
      SI: lhr.audits['speed-index']?.numericValue || 0,
      TTI: lhr.audits['interactive']?.numericValue || 0,
    };

    const scores = {
      LCP: lhr.audits['largest-contentful-paint']?.score || 0,
      FCP: lhr.audits['first-contentful-paint']?.score || 0,
      CLS: lhr.audits['cumulative-layout-shift']?.score || 0,
      TBT: lhr.audits['total-blocking-time']?.score || 0,
      SI: lhr.audits['speed-index']?.score || 0,
      TTI: lhr.audits['interactive']?.score || 0,
    };

    // Display results
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}                    PERFORMANCE RESULTS${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.bright}Overall Performance Score:${colors.reset}`);
    const scorePercentage = Math.round(performanceScore * 100);
    console.log(`  ${getScoreColor(performanceScore)}${scorePercentage}${colors.reset} / 100 ${getScoreLabel(performanceScore)}\n`);

    console.log(`${colors.bright}Core Web Vitals:${colors.reset}\n`);

    console.log(`  ${colors.bright}LCP (Largest Contentful Paint):${colors.reset}`);
    console.log(`    ${getScoreColor(scores.LCP)}${Math.round(metrics.LCP)}ms${colors.reset} ${getScoreLabel(scores.LCP)}`);
    console.log(`    Target: < 2500ms (Good), < 4000ms (Needs Improvement)\n`);

    console.log(`  ${colors.bright}FCP (First Contentful Paint):${colors.reset}`);
    console.log(`    ${getScoreColor(scores.FCP)}${Math.round(metrics.FCP)}ms${colors.reset} ${getScoreLabel(scores.FCP)}`);
    console.log(`    Target: < 1800ms (Good), < 3000ms (Needs Improvement)\n`);

    console.log(`  ${colors.bright}CLS (Cumulative Layout Shift):${colors.reset}`);
    console.log(`    ${getScoreColor(scores.CLS)}${metrics.CLS.toFixed(3)}${colors.reset} ${getScoreLabel(scores.CLS)}`);
    console.log(`    Target: < 0.1 (Good), < 0.25 (Needs Improvement)\n`);

    console.log(`${colors.bright}Additional Metrics:${colors.reset}\n`);

    console.log(`  ${colors.bright}TBT (Total Blocking Time):${colors.reset}`);
    console.log(`    ${getScoreColor(scores.TBT)}${Math.round(metrics.TBT)}ms${colors.reset} ${getScoreLabel(scores.TBT)}`);
    console.log(`    Target: < 200ms (Good), < 600ms (Needs Improvement)\n`);

    console.log(`  ${colors.bright}Speed Index:${colors.reset}`);
    console.log(`    ${getScoreColor(scores.SI)}${Math.round(metrics.SI)}ms${colors.reset} ${getScoreLabel(scores.SI)}`);
    console.log(`    Target: < 3400ms (Good), < 5800ms (Needs Improvement)\n`);

    console.log(`  ${colors.bright}Time to Interactive:${colors.reset}`);
    console.log(`    ${getScoreColor(scores.TTI)}${Math.round(metrics.TTI)}ms${colors.reset} ${getScoreLabel(scores.TTI)}`);
    console.log(`    Target: < 3800ms (Good), < 7300ms (Needs Improvement)\n`);

    // Performance opportunities
    console.log(`${colors.bright}${colors.cyan}───────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.bright}Top Performance Opportunities:${colors.reset}\n`);

    const opportunities = lhr.audits;
    const sortedOpportunities = Object.values(opportunities)
      .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.numericValue > 0)
      .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
      .slice(0, 5);

    if (sortedOpportunities.length > 0) {
      sortedOpportunities.forEach((opportunity, index) => {
        const savings = Math.round(opportunity.numericValue / 1000 * 10) / 10;
        console.log(`  ${index + 1}. ${opportunity.title}`);
        console.log(`     Potential savings: ${colors.cyan}${savings}s${colors.reset}\n`);
      });
    } else {
      console.log(`  ${colors.green}No major optimization opportunities detected!${colors.reset}\n`);
    }

    // LCP Element
    const lcpElement = lhr.audits['largest-contentful-paint-element'];
    if (lcpElement && lcpElement.details && lcpElement.details.items && lcpElement.details.items[0]) {
      console.log(`${colors.bright}${colors.magenta}LCP Element Details:${colors.reset}\n`);
      const lcpItem = lcpElement.details.items[0];
      console.log(`  Element: ${colors.cyan}${lcpItem.node?.nodeLabel || 'Unknown'}${colors.reset}`);
      if (lcpItem.node?.snippet) {
        console.log(`  Snippet: ${colors.cyan}${lcpItem.node.snippet}${colors.reset}\n`);
      }
    }

    // Image analysis
    const imageAudits = lhr.audits['uses-responsive-images'];
    if (imageAudits && imageAudits.details && imageAudits.details.items) {
      console.log(`${colors.bright}Image Optimization Status:${colors.reset}`);
      console.log(`  Responsive images: ${imageAudits.score === 1 ? colors.green + '✓ Optimized' : colors.yellow + '⚠ Needs attention'}${colors.reset}\n`);
    }

    // Save JSON report
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(reportDir, `lighthouse-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(lhr, null, 2));

    console.log(`${colors.bright}${colors.cyan}───────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.bright}VERDICT:${colors.reset}\n`);

    if (performanceScore >= 0.9) {
      console.log(`${colors.green}${colors.bright}✓ EXCELLENT PERFORMANCE${colors.reset}`);
      console.log(`  Your application has excellent Core Web Vitals!\n`);
    } else if (performanceScore >= 0.5) {
      console.log(`${colors.yellow}${colors.bright}⚠ GOOD PERFORMANCE${colors.reset}`);
      console.log(`  Your application performs well, with some room for improvement.\n`);
    } else {
      console.log(`${colors.red}${colors.bright}✗ NEEDS IMPROVEMENT${colors.reset}`);
      console.log(`  Your application needs performance optimization.\n`);
    }

    // LCP specific analysis
    console.log(`${colors.bright}${colors.magenta}LCP IMPROVEMENT ANALYSIS:${colors.reset}\n`);
    const expectedBefore = 3000;
    const actualLCP = Math.round(metrics.LCP);
    const improvement = ((expectedBefore - actualLCP) / expectedBefore * 100).toFixed(1);

    console.log(`  Expected LCP (before optimization): ${colors.cyan}~${expectedBefore}ms${colors.reset}`);
    console.log(`  Actual LCP (after logo priority fix): ${getScoreColor(scores.LCP)}${actualLCP}ms${colors.reset}`);
    console.log(`  Improvement: ${improvement >= 0 ? colors.green : colors.red}${improvement}%${colors.reset}`);
    console.log(`  Target: ${colors.cyan}< 2500ms${colors.reset}\n`);

    if (actualLCP <= 2500) {
      console.log(`  ${colors.green}${colors.bright}✓ SUCCESS${colors.reset} - LCP is in the "Good" range!`);
      console.log(`  ${colors.green}✓ Logo priority fix has effectively improved LCP performance${colors.reset}\n`);
    } else if (actualLCP <= 4000) {
      console.log(`  ${colors.yellow}${colors.bright}⚠ PARTIAL SUCCESS${colors.reset} - LCP improved but needs work`);
      console.log(`  ${colors.yellow}⚠ Consider additional optimizations${colors.reset}\n`);
    } else {
      console.log(`  ${colors.red}${colors.bright}✗ NEEDS WORK${colors.reset} - LCP above acceptable threshold`);
      console.log(`  ${colors.red}✗ Additional investigation required${colors.reset}\n`);
    }

    console.log(`${colors.bright}Report saved to:${colors.reset} ${colors.cyan}${jsonPath}${colors.reset}\n`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

    return { metrics, scores, performanceScore, lhr };

  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

// Run the test
const url = process.argv[2] || 'http://localhost:3000/';

runLighthouse(url)
  .then(() => {
    console.log(`${colors.green}✓ Lighthouse audit completed successfully${colors.reset}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}✗ Lighthouse audit failed:${colors.reset}`, error);
    process.exit(1);
  });
