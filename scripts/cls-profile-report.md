# CLS Profile Report

**URL:** http://localhost:3009/feed
**Timestamp:** 2025-10-22T23:40:48.661Z
**Total CLS Score:** 0.0000
**Grade:** Good
**Total Layout Shifts:** 0

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| CLS Score | 0.0000 | Good |
| Threshold (Good) | ≤ 0.1 | ✅ |
| Threshold (Needs Improvement) | ≤ 0.25 | ✅ |

## Scenario Analysis

### initialLoad

- **CLS Score:** 0.0000
- **Shift Count:** 0
- **Load Time:** 9976ms

**Web Vitals:**
- LCP: 1424.00ms
- FCP: 248.00ms
- TTFB: 119.70ms

### fontLoading

- **CLS Score:** 0.0000
- **Shift Count:** 0
- **Font Load Time:** 98.30ms

### slowImageLoading

- **CLS Score:** 0.0000
- **Shift Count:** 0

### scrollInteraction

- **CLS Score:** 0.0000
- **Shift Count:** 0

## Recommendations

✅ **Excellent!** Your CLS score is within the "Good" threshold.

Continue to monitor for regressions and ensure:
- All images have explicit dimensions or aspect ratios
- Fonts are loaded with font-display: swap or optional
- Dynamic content has reserved space
