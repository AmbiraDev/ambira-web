# Manual Performance Testing Guide
**Verify Core Web Vitals Improvements - Feed Page**

---

## Quick Testing Instructions

### Option 1: Chrome DevTools Lighthouse (Recommended)

1. **Open the feed page in Chrome**
   ```
   http://localhost:3000/
   ```

2. **Open Chrome DevTools**
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `F12` or `Ctrl + Shift + I`

3. **Navigate to Lighthouse tab**
   - Click the "Lighthouse" tab (might be under ">>" more tools)

4. **Configure the audit**
   - Mode: Navigation (default)
   - Device: Desktop
   - Categories: ✓ Performance (uncheck others for faster results)

5. **Generate report**
   - Click "Analyze page load"
   - Wait for audit to complete (30-60 seconds)

6. **Review Core Web Vitals**
   - Look for:
     - **Performance Score**: Should be 85-95+
     - **LCP**: Should be < 2.5s (green)
     - **CLS**: Should be < 0.1 (green)
     - **FCP**: Should be < 1.8s (green)

### Option 2: Performance Panel Analysis

1. **Open Chrome DevTools Performance panel**

2. **Start recording**
   - Click the record button (circle icon)
   - Or press `Cmd + E` (Mac) / `Ctrl + E` (Windows)

3. **Reload the page**
   - Press `Cmd + R` (Mac) / `Ctrl + R` (Windows)

4. **Stop recording** after page loads

5. **Analyze the timeline**
   - Look for the **LCP marker** (blue line with "LCP" label)
   - Check when it occurs (should be < 2500ms)
   - Verify no layout shifts (red bars in "Experience" track)
   - Confirm FCP happens early (green line)

### Option 3: Network Panel Priority Verification

1. **Open Chrome DevTools Network panel**

2. **Enable priority column**
   - Right-click on column headers
   - Check "Priority"

3. **Reload the page**

4. **Verify image loading**
   - First 2-3 images should show "High" or "Highest" priority
   - Look for images with names containing:
     - User profile pictures from first sessions
     - Session images from above-the-fold content
   - Below-fold images should show "Low" priority
   - Verify they load via lazy loading (later in timeline)

---

## Detailed Testing Scenarios

### Scenario 1: Desktop Fast 4G

**Setup:**
1. Chrome DevTools > Network tab
2. Set throttling to "Fast 4G"
3. Check "Disable cache"

**Expected Results:**
- LCP: 800-1500ms
- FCP: 400-800ms
- CLS: < 0.05
- All above-the-fold images load within 1-2 seconds

**Test:**
```
1. Reload page with DevTools open
2. Check Performance tab
3. Verify LCP marker location
4. Confirm no layout shifts
```

### Scenario 2: Desktop Slow 3G

**Setup:**
1. Chrome DevTools > Network tab
2. Set throttling to "Slow 3G"
3. Check "Disable cache"

**Expected Results:**
- LCP: 1800-2500ms
- FCP: 1000-1500ms
- CLS: < 0.05
- Progressive loading visible

**Test:**
```
1. Reload page with DevTools open
2. Observe loading sequence:
   - Text appears first (font-display: swap)
   - Above-fold images load next
   - Below-fold images lazy load on scroll
3. Verify no content jumping
```

### Scenario 3: Mobile Device

**Setup:**
1. Chrome DevTools > Toggle device toolbar (Cmd+Shift+M)
2. Select "iPhone 12 Pro" or similar
3. Set throttling to "Fast 4G"

**Expected Results:**
- LCP: 1200-2000ms
- FCP: 600-1200ms
- CLS: < 0.05
- Touch-optimized loading

**Test:**
```
1. Reload page in mobile view
2. Run Lighthouse in mobile mode
3. Verify touch targets are adequate
4. Check layout doesn't shift on scroll
```

---

## Verification Checklist

### Core Web Vitals

- [ ] **LCP < 2.5s** (Desktop, Fast 4G)
- [ ] **LCP < 2.5s** (Mobile, Fast 4G)
- [ ] **CLS < 0.1** (All devices)
- [ ] **FCP < 1.8s** (Desktop)
- [ ] **Performance Score > 85** (Lighthouse)

### Image Loading Strategy

- [ ] First 2 session cards load with priority
- [ ] User avatars in top sessions load immediately
- [ ] First image in galleries loads with priority
- [ ] Below-fold images lazy load (verify in Network panel)
- [ ] Images are WebP format (check Network panel)
- [ ] Responsive sizes are used (check srcset in Elements panel)

### Layout Stability

- [ ] No layout shift during initial load
- [ ] No layout shift when images load
- [ ] No layout shift when scrolling
- [ ] Skeleton loaders maintain correct spacing
- [ ] Background placeholders prevent jumping

### Font Loading

- [ ] Text appears immediately (no FOIT)
- [ ] Font swap is smooth (no jarring flash)
- [ ] No layout shift when custom font loads
- [ ] Fallback font is readable

### Performance Optimizations

- [ ] Priority images have `fetchpriority="high"` in HTML
- [ ] Lazy images have `loading="lazy"` in HTML
- [ ] Images have explicit width/height attributes
- [ ] CSS contains aspect-ratio declarations
- [ ] Font has `font-display: swap` in CSS

---

## How to Check Specific Optimizations

### Check Image Priority in HTML

1. **Open Elements panel in DevTools**
2. **Search for `<img` tags** (Cmd+F)
3. **Verify first 2-3 session images have:**
   ```html
   <img
     fetchpriority="high"
     loading="eager"
     srcset="..."
     sizes="..."
   />
   ```

4. **Verify below-fold images have:**
   ```html
   <img
     loading="lazy"
     srcset="..."
     sizes="..."
   />
   ```

### Check Font Loading Strategy

1. **Open Network panel**
2. **Filter by "Font"**
3. **Reload page**
4. **Verify Inter font loads early**
5. **Check Response Headers** should include:
   ```
   font-display: swap
   ```

### Check Layout Shift Score

1. **Open Performance panel**
2. **Record page load**
3. **Look at "Experience" track** (at bottom)
4. **Red bars = layout shifts** (should see none or minimal)
5. **Hover over any red bars** to see CLS contribution

### Check LCP Element

1. **Run Lighthouse audit**
2. **Scroll to "Largest Contentful Paint element" section**
3. **Verify it's:**
   - A session image (ideal)
   - A user avatar (acceptable)
   - Text (only on loading state)
4. **Click "View Treemap"** to see size breakdown

---

## Common Issues & Solutions

### Issue: LCP is still > 2.5s

**Check:**
- Are you testing with authentication? (Real feed content)
- Is network throttling too aggressive?
- Are images optimized? (Should be WebP)
- Is the LCP element loading with priority?

**Solution:**
- Verify priority prop is passed correctly
- Check image formats in Network panel
- Test without network throttling first
- Ensure Firebase images are compressed

### Issue: CLS > 0.1

**Check:**
- Do images have explicit dimensions?
- Are aspect ratios set in CSS?
- Do skeleton loaders match content size?

**Solution:**
- Add width/height to all images
- Verify aspect-ratio CSS is applied
- Check background placeholders are present

### Issue: Font causes layout shift

**Check:**
- Is `display: 'swap'` set on font?
- Is font preloaded?
- Is fallback font similar in size?

**Solution:**
- Verify layout.tsx has display: 'swap'
- Check font is preloading (Link rel="preload")
- Adjust fallback font to match metrics

---

## Performance Metrics Reference

### Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Lighthouse Score Ranges

| Score | Rating | Color |
|-------|--------|-------|
| **90-100** | Good | 🟢 Green |
| **50-89** | Needs Improvement | 🟠 Orange |
| **0-49** | Poor | 🔴 Red |

### Additional Metrics

| Metric | Good | Acceptable |
|--------|------|------------|
| **FCP** | ≤ 1.8s | ≤ 3.0s |
| **TTI** | ≤ 3.8s | ≤ 7.3s |
| **TBT** | ≤ 200ms | ≤ 600ms |
| **SI** | ≤ 3.4s | ≤ 5.8s |

---

## Quick Commands

### Test with Chrome DevTools CLI

```bash
# Open Chrome with remote debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --headless \
  http://localhost:3000/
```

### Run Lighthouse from Command Line

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000/ \
  --only-categories=performance \
  --view

# Run with options
lighthouse http://localhost:3000/ \
  --throttling-method=devtools \
  --throttling.cpuSlowdownMultiplier=4 \
  --view
```

### Simulate Different Networks

```bash
# In Chrome DevTools Console
# Slow 3G
Network.emulateNetworkConditions({
  offline: false,
  downloadThroughput: 400 * 1024 / 8,
  uploadThroughput: 400 * 1024 / 8,
  latency: 400
});

# Fast 4G
Network.emulateNetworkConditions({
  offline: false,
  downloadThroughput: 4 * 1024 * 1024 / 8,
  uploadThroughput: 3 * 1024 * 1024 / 8,
  latency: 20
});
```

---

## Real User Monitoring (Production)

### Vercel Speed Insights

1. **Navigate to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select your project**

3. **Click "Speed Insights" tab**

4. **Monitor Real User Metrics:**
   - Overall Core Web Vitals scores
   - P75 performance metrics
   - Device breakdown (mobile vs desktop)
   - Geographic performance
   - Historical trends

### Custom Web Vitals Tracking

If you want to add custom tracking:

```typescript
// src/app/page.tsx or layout.tsx
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    console.log(metric);

    // Send to analytics
    if (metric.name === 'LCP') {
      console.log('LCP:', metric.value, 'ms');
    }
    if (metric.name === 'CLS') {
      console.log('CLS:', metric.value);
    }
    if (metric.name === 'FCP') {
      console.log('FCP:', metric.value, 'ms');
    }
  });

  return null;
}
```

---

## Expected Test Results Summary

### ✅ Success Criteria

After running manual tests, you should see:

1. **Lighthouse Performance Score: 85-95+**
2. **LCP (Desktop): 800-1500ms** (< 2500ms threshold)
3. **LCP (Mobile): 1200-2000ms** (< 2500ms threshold)
4. **CLS: < 0.05** (< 0.1 threshold)
5. **FCP: 400-1200ms** (< 1800ms threshold)
6. **Priority images load first** (visible in Network panel)
7. **No layout shifts** (visible in Performance panel)
8. **Font loads without FOIT** (text visible immediately)

### 🎯 Optimization Verification

- ✅ Logo loads with priority
- ✅ First 2 session cards prioritized
- ✅ User avatars load eagerly above-the-fold
- ✅ Below-fold images lazy load
- ✅ Zero layout shift (CLS ≈ 0)
- ✅ Font-display: swap prevents FOIT
- ✅ Images are WebP format
- ✅ Responsive image sizes working

---

**Happy Testing!** 🚀

For detailed analysis and automated test results, see:
- `/CORE_WEB_VITALS_TEST_REPORT.md`
- `/PERFORMANCE_AUDIT_REPORT.md`
- `/PERFORMANCE_OPTIMIZATION_SUMMARY.md`
