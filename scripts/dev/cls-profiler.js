/**
 * Comprehensive CLS (Cumulative Layout Shift) Profiler
 *
 * This script profiles layout shifts on a page and provides detailed analysis
 * of what elements are causing shifts and when they occur.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CLSProfiler {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      headless: false,
      slowMo: 0,
      viewport: { width: 1920, height: 1080 },
      waitTime: 10000, // Time to wait for page to fully load
      screenshots: true,
      ...options,
    };
    this.results = {
      url,
      timestamp: new Date().toISOString(),
      layoutShifts: [],
      totalCLS: 0,
      maxCLS: 0,
      scenarios: {},
    };
  }

  /**
   * Initialize browser and page with performance monitoring
   */
  async initialize() {
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: ['--enable-precise-memory-info'],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(this.options.viewport);

    // Enable performance metrics
    await this.page.evaluateOnNewDocument(() => {
      window.layoutShifts = [];
      window.performanceMetrics = {
        navigationStart: 0,
        fontLoadStart: 0,
        fontLoadEnd: 0,
        imageLoadStart: 0,
        imageLoadEnd: 0,
      };
    });
  }

  /**
   * Inject CLS monitoring script into the page
   */
  async injectCLSMonitor() {
    await this.page.evaluateOnNewDocument(() => {
      // Track layout shifts with detailed information
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            const shift = {
              value: entry.value,
              startTime: entry.startTime,
              duration: entry.duration,
              hadRecentInput: entry.hadRecentInput,
              lastInputTime: entry.lastInputTime,
              sources: entry.sources
                ? Array.from(entry.sources).map(source => ({
                    node: source.node
                      ? {
                          tagName: source.node.tagName,
                          id: source.node.id,
                          className: source.node.className,
                          outerHTML: source.node.outerHTML
                            ? source.node.outerHTML.substring(0, 200)
                            : '',
                          boundingRect: source.node.getBoundingClientRect
                            ? {
                                top: source.node.getBoundingClientRect().top,
                                left: source.node.getBoundingClientRect().left,
                                width:
                                  source.node.getBoundingClientRect().width,
                                height:
                                  source.node.getBoundingClientRect().height,
                              }
                            : null,
                        }
                      : null,
                    previousRect: source.previousRect
                      ? {
                          x: source.previousRect.x,
                          y: source.previousRect.y,
                          width: source.previousRect.width,
                          height: source.previousRect.height,
                        }
                      : null,
                    currentRect: source.currentRect
                      ? {
                          x: source.currentRect.x,
                          y: source.currentRect.y,
                          width: source.currentRect.width,
                          height: source.currentRect.height,
                        }
                      : null,
                  }))
                : [],
            };

            window.layoutShifts.push(shift);
            console.log('Layout Shift Detected:', shift);
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      // Monitor font loading
      if (document.fonts) {
        window.performanceMetrics.fontLoadStart = performance.now();
        document.fonts.ready.then(() => {
          window.performanceMetrics.fontLoadEnd = performance.now();
          console.log(
            'Fonts loaded at:',
            window.performanceMetrics.fontLoadEnd
          );
        });
      }

      // Monitor image loading
      window.addEventListener('load', () => {
        const images = document.querySelectorAll('img');
        let loadedImages = 0;
        const totalImages = images.length;

        window.performanceMetrics.imageLoadStart = performance.now();

        images.forEach(img => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.addEventListener('load', () => {
              loadedImages++;
              if (loadedImages === totalImages) {
                window.performanceMetrics.imageLoadEnd = performance.now();
                console.log(
                  'All images loaded at:',
                  window.performanceMetrics.imageLoadEnd
                );
              }
            });
          }
        });

        if (loadedImages === totalImages) {
          window.performanceMetrics.imageLoadEnd = performance.now();
        }
      });

      // Track navigation start
      window.performanceMetrics.navigationStart = performance.now();
    });
  }

  /**
   * Get Web Vitals metrics
   */
  async getWebVitals() {
    return await this.page.evaluate(() => {
      return new Promise(resolve => {
        const metrics = {
          CLS: 0,
          LCP: 0,
          FID: 0,
          FCP: 0,
          TTFB: 0,
        };

        // Get CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        metrics.CLS = clsValue;

        // Get LCP
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });

        // Get FCP
        const fcpObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              metrics.FCP = entry.startTime;
            }
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // Get TTFB
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
          metrics.TTFB =
            navigationTiming.responseStart - navigationTiming.requestStart;
        }

        setTimeout(() => resolve(metrics), 100);
      });
    });
  }

  /**
   * Capture layout shifts during page load
   */
  async profileInitialLoad() {
    console.log('\n=== Profiling Initial Page Load ===\n');

    await this.injectCLSMonitor();

    const startTime = Date.now();
    await this.page.goto(this.url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for additional time to catch late shifts
    await new Promise(resolve => setTimeout(resolve, this.options.waitTime));

    const loadTime = Date.now() - startTime;

    // Get layout shifts
    const layoutShifts = await this.page.evaluate(() => window.layoutShifts);
    const performanceMetrics = await this.page.evaluate(
      () => window.performanceMetrics
    );
    const webVitals = await this.getWebVitals();

    // Calculate total CLS
    const totalCLS = layoutShifts.reduce((sum, shift) => sum + shift.value, 0);

    this.results.scenarios.initialLoad = {
      loadTime,
      layoutShifts,
      totalCLS,
      performanceMetrics,
      webVitals,
      shiftCount: layoutShifts.length,
    };

    if (this.options.screenshots && layoutShifts.length > 0) {
      await this.page.screenshot({
        path: path.join(__dirname, 'cls-profile-initial-load.png'),
        fullPage: true,
      });
    }

    console.log(`Initial Load CLS: ${totalCLS.toFixed(4)}`);
    console.log(`Layout Shifts Detected: ${layoutShifts.length}`);
    console.log(`Load Time: ${loadTime}ms`);
  }

  /**
   * Profile during font loading
   */
  async profileFontLoading() {
    console.log('\n=== Profiling Font Loading ===\n');

    // Clear cache and disable font cache
    await this.page.setCacheEnabled(false);

    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 5000));

    const layoutShifts = await this.page.evaluate(() => window.layoutShifts);
    const fontMetrics = await this.page.evaluate(
      () => window.performanceMetrics
    );

    // Filter shifts that occurred during font loading
    const fontLoadShifts = layoutShifts.filter(shift => {
      return (
        shift.startTime >= fontMetrics.fontLoadStart &&
        shift.startTime <= fontMetrics.fontLoadEnd
      );
    });

    this.results.scenarios.fontLoading = {
      layoutShifts: fontLoadShifts,
      totalCLS: fontLoadShifts.reduce((sum, shift) => sum + shift.value, 0),
      fontLoadTime: fontMetrics.fontLoadEnd - fontMetrics.fontLoadStart,
      shiftCount: fontLoadShifts.length,
    };

    console.log(
      `Font Loading CLS: ${this.results.scenarios.fontLoading.totalCLS.toFixed(4)}`
    );
    console.log(
      `Font Load Time: ${this.results.scenarios.fontLoading.fontLoadTime.toFixed(2)}ms`
    );
  }

  /**
   * Profile during image loading with slow 3G network
   */
  async profileSlowImageLoading() {
    console.log('\n=== Profiling Image Loading (Slow 3G) ===\n');

    const client = await this.page.target().createCDPSession();

    // Emulate slow 3G
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500kb/s
      uploadThroughput: (500 * 1024) / 8,
      latency: 400,
    });

    await this.injectCLSMonitor();
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait longer for slow network

    const layoutShifts = await this.page.evaluate(() => window.layoutShifts);
    const imageMetrics = await this.page.evaluate(
      () => window.performanceMetrics
    );

    this.results.scenarios.slowImageLoading = {
      layoutShifts,
      totalCLS: layoutShifts.reduce((sum, shift) => sum + shift.value, 0),
      imageLoadTime: imageMetrics.imageLoadEnd - imageMetrics.imageLoadStart,
      shiftCount: layoutShifts.length,
    };

    // Reset network conditions
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });

    console.log(
      `Slow Image Loading CLS: ${this.results.scenarios.slowImageLoading.totalCLS.toFixed(4)}`
    );
  }

  /**
   * Profile during scroll and interaction
   */
  async profileScrollAndInteraction() {
    console.log('\n=== Profiling Scroll and Interaction ===\n');

    await this.page.goto(this.url, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear previous shifts
    await this.page.evaluate(() => {
      window.layoutShifts = [];
    });

    // Scroll down the page
    await this.page.evaluate(() => {
      window.scrollTo({
        top: document.body.scrollHeight / 2,
        behavior: 'smooth',
      });
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const layoutShifts = await this.page.evaluate(() => window.layoutShifts);

    this.results.scenarios.scrollInteraction = {
      layoutShifts,
      totalCLS: layoutShifts.reduce((sum, shift) => sum + shift.value, 0),
      shiftCount: layoutShifts.length,
    };

    console.log(
      `Scroll Interaction CLS: ${this.results.scenarios.scrollInteraction.totalCLS.toFixed(4)}`
    );
  }

  /**
   * Check for images without dimensions
   */
  async checkImagesWithoutDimensions() {
    console.log('\n=== Checking Images Without Dimensions ===\n');

    const imagesWithoutDimensions = await this.page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const problematic = [];

      images.forEach((img, index) => {
        const hasWidth = img.hasAttribute('width') || img.style.width;
        const hasHeight = img.hasAttribute('height') || img.style.height;
        const hasAspectRatio =
          img.style.aspectRatio ||
          window.getComputedStyle(img).aspectRatio !== 'auto';

        if (!hasWidth || !hasHeight) {
          if (!hasAspectRatio) {
            problematic.push({
              index,
              src: img.src,
              alt: img.alt,
              className: img.className,
              id: img.id,
              hasWidth,
              hasHeight,
              hasAspectRatio,
              computedWidth: window.getComputedStyle(img).width,
              computedHeight: window.getComputedStyle(img).height,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
            });
          }
        }
      });

      return problematic;
    });

    this.results.imagesWithoutDimensions = imagesWithoutDimensions;
    console.log(
      `Images without proper dimensions: ${imagesWithoutDimensions.length}`
    );
  }

  /**
   * Analyze layout shift sources
   */
  analyzeShiftSources() {
    console.log('\n=== Analyzing Layout Shift Sources ===\n');

    const allShifts = [];
    Object.values(this.results.scenarios).forEach(scenario => {
      if (scenario.layoutShifts) {
        allShifts.push(...scenario.layoutShifts);
      }
    });

    // Group by element
    const elementShifts = {};
    allShifts.forEach(shift => {
      shift.sources.forEach(source => {
        if (source.node) {
          const key = `${source.node.tagName}.${source.node.className || source.node.id || 'unknown'}`;
          if (!elementShifts[key]) {
            elementShifts[key] = {
              element: source.node,
              shifts: [],
              totalScore: 0,
              count: 0,
            };
          }
          elementShifts[key].shifts.push(shift);
          elementShifts[key].totalScore += shift.value;
          elementShifts[key].count++;
        }
      });
    });

    // Sort by impact
    const sortedElements = Object.entries(elementShifts).sort(
      ([, a], [, b]) => b.totalScore - a.totalScore
    );

    this.results.topShiftingElements = sortedElements
      .slice(0, 10)
      .map(([key, data]) => ({
        element: key,
        totalScore: data.totalScore,
        shiftCount: data.count,
        averageShift: data.totalScore / data.count,
        elementDetails: data.element,
      }));

    console.log('Top 5 shifting elements:');
    this.results.topShiftingElements.slice(0, 5).forEach((item, i) => {
      console.log(
        `${i + 1}. ${item.element} - CLS: ${item.totalScore.toFixed(4)} (${item.shiftCount} shifts)`
      );
    });
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n=== CLS Profile Report ===\n');

    // Calculate overall metrics
    let totalCLS = 0;
    let totalShifts = 0;

    Object.entries(this.results.scenarios).forEach(([, scenario]) => {
      totalCLS += scenario.totalCLS || 0;
      totalShifts += scenario.shiftCount || 0;
    });

    this.results.summary = {
      totalCLS,
      totalShifts,
      grade:
        totalCLS <= 0.1
          ? 'Good'
          : totalCLS <= 0.25
            ? 'Needs Improvement'
            : 'Poor',
      timestamp: this.results.timestamp,
    };

    console.log(`Total CLS Score: ${totalCLS.toFixed(4)}`);
    console.log(`Grade: ${this.results.summary.grade}`);
    console.log(`Total Layout Shifts: ${totalShifts}`);
    console.log('\nScenario Breakdown:');

    Object.entries(this.results.scenarios).forEach(([name, scenario]) => {
      console.log(
        `  ${name}: ${scenario.totalCLS.toFixed(4)} (${scenario.shiftCount} shifts)`
      );
    });

    return this.results;
  }

  /**
   * Save report to file
   */
  async saveReport(filename = 'cls-profile-report.json') {
    const reportPath = path.join(__dirname, filename);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);

    // Also save a human-readable markdown report
    const mdReport = this.generateMarkdownReport();
    const mdPath = path.join(__dirname, filename.replace('.json', '.md'));
    fs.writeFileSync(mdPath, mdReport);
    console.log(`Markdown report saved to: ${mdPath}`);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const { summary, scenarios, topShiftingElements, imagesWithoutDimensions } =
      this.results;

    let md = `# CLS Profile Report\n\n`;
    md += `**URL:** ${this.url}\n`;
    md += `**Timestamp:** ${summary.timestamp}\n`;
    md += `**Total CLS Score:** ${summary.totalCLS.toFixed(4)}\n`;
    md += `**Grade:** ${summary.grade}\n`;
    md += `**Total Layout Shifts:** ${summary.totalShifts}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Value | Status |\n`;
    md += `|--------|-------|--------|\n`;
    md += `| CLS Score | ${summary.totalCLS.toFixed(4)} | ${summary.grade} |\n`;
    md += `| Threshold (Good) | ≤ 0.1 | ${summary.totalCLS <= 0.1 ? '✅' : '❌'} |\n`;
    md += `| Threshold (Needs Improvement) | ≤ 0.25 | ${summary.totalCLS <= 0.25 ? '✅' : '❌'} |\n\n`;

    md += `## Scenario Analysis\n\n`;
    Object.entries(scenarios).forEach(([name, scenario]) => {
      md += `### ${name}\n\n`;
      md += `- **CLS Score:** ${scenario.totalCLS.toFixed(4)}\n`;
      md += `- **Shift Count:** ${scenario.shiftCount}\n`;
      if (scenario.loadTime) md += `- **Load Time:** ${scenario.loadTime}ms\n`;
      if (scenario.fontLoadTime)
        md += `- **Font Load Time:** ${scenario.fontLoadTime.toFixed(2)}ms\n`;
      if (scenario.imageLoadTime)
        md += `- **Image Load Time:** ${scenario.imageLoadTime.toFixed(2)}ms\n`;
      md += `\n`;

      if (scenario.webVitals) {
        md += `**Web Vitals:**\n`;
        md += `- LCP: ${scenario.webVitals.LCP.toFixed(2)}ms\n`;
        md += `- FCP: ${scenario.webVitals.FCP.toFixed(2)}ms\n`;
        md += `- TTFB: ${scenario.webVitals.TTFB.toFixed(2)}ms\n\n`;
      }
    });

    if (topShiftingElements && topShiftingElements.length > 0) {
      md += `## Top Shifting Elements\n\n`;
      md += `| Rank | Element | CLS Score | Shift Count | Avg Shift |\n`;
      md += `|------|---------|-----------|-------------|----------|\n`;
      topShiftingElements.forEach((item, i) => {
        md += `| ${i + 1} | ${item.element} | ${item.totalScore.toFixed(4)} | ${item.shiftCount} | ${item.averageShift.toFixed(4)} |\n`;
      });
      md += `\n`;
    }

    if (imagesWithoutDimensions && imagesWithoutDimensions.length > 0) {
      md += `## Images Without Proper Dimensions\n\n`;
      md += `Found ${imagesWithoutDimensions.length} images without proper width/height or aspect-ratio:\n\n`;
      imagesWithoutDimensions.forEach((img, i) => {
        md += `${i + 1}. **${img.src}**\n`;
        md += `   - Class: ${img.className || 'none'}\n`;
        md += `   - ID: ${img.id || 'none'}\n`;
        md += `   - Natural Size: ${img.naturalWidth}x${img.naturalHeight}\n`;
        md += `   - Has Width: ${img.hasWidth ? '✅' : '❌'}\n`;
        md += `   - Has Height: ${img.hasHeight ? '✅' : '❌'}\n`;
        md += `   - Has Aspect Ratio: ${img.hasAspectRatio ? '✅' : '❌'}\n\n`;
      });
    }

    md += `## Recommendations\n\n`;
    if (summary.totalCLS <= 0.1) {
      md += `✅ **Excellent!** Your CLS score is within the "Good" threshold.\n\n`;
      md += `Continue to monitor for regressions and ensure:\n`;
      md += `- All images have explicit dimensions or aspect ratios\n`;
      md += `- Fonts are loaded with font-display: swap or optional\n`;
      md += `- Dynamic content has reserved space\n`;
    } else if (summary.totalCLS <= 0.25) {
      md += `⚠️ **Needs Improvement** - Your CLS score needs optimization.\n\n`;
      md += `Priority actions:\n`;
      md += `1. Review top shifting elements above\n`;
      md += `2. Add dimensions to images without them\n`;
      md += `3. Optimize font loading strategy\n`;
      md += `4. Reserve space for dynamic content\n`;
    } else {
      md += `❌ **Poor** - Your CLS score requires immediate attention.\n\n`;
      md += `Critical actions:\n`;
      md += `1. Fix all images without dimensions\n`;
      md += `2. Implement font loading optimization\n`;
      md += `3. Eliminate layout shifts from dynamic content\n`;
      md += `4. Review and fix top shifting elements\n`;
    }

    return md;
  }

  /**
   * Run complete profiling suite
   */
  async run() {
    try {
      await this.initialize();

      await this.profileInitialLoad();
      await this.checkImagesWithoutDimensions();
      await this.profileFontLoading();
      await this.profileSlowImageLoading();
      await this.profileScrollAndInteraction();

      this.analyzeShiftSources();
      this.generateReport();
      await this.saveReport();
    } catch (error) {
      console.error('Error during profiling:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Main execution
const url = process.argv[2] || 'http://localhost:3000/feed';
const profiler = new CLSProfiler(url, {
  headless: true,
  screenshots: true,
  waitTime: 8000,
});

profiler.run().catch(console.error);
