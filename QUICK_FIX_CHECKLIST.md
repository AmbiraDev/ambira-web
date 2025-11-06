# Firebase Optimization Quick Fix Checklist

Use this checklist to track implementation progress of the 5 critical fixes.

## Phase 1: Quick Wins (Target: 1 Week)

### Fix 1: Batch Load Followers/Following

- **File**: `src/lib/api/users/index.ts`
- **Functions**: `getFollowers()`, `getFollowing()`
- **Change**: Replace sequential `getDoc()` calls with `Promise.all()`
- **Lines**: 834-902 and 912-980
- **Expected Savings**: 85-90% reduction

**Checklist**:

- [ ] Read implementation guide section for Fix 1
- [ ] Update `getFollowers()` with batch loading
- [ ] Update `getFollowing()` with batch loading
- [ ] Run unit tests: `npm test -- users/index.test.ts`
- [ ] Verify no TypeScript errors: `npm run type-check`
- [ ] Manual test with follower list
- [ ] Code review by team
- [ ] Merge to branch

### Fix 2: Deduplicate Feed Post Processing

- **File**: `src/lib/api/sessions/posts.ts`
- **Function**: `_processPosts()`
- **Change**: Deduplicate user/session queries before batch loading
- **Lines**: 70-207
- **Expected Savings**: 70-75% reduction

**Checklist**:

- [ ] Read implementation guide section for Fix 2
- [ ] Replace sequential loads with deduplication + batch
- [ ] Update lookup map creation
- [ ] Build results from maps without additional reads
- [ ] Run feed tests: `npm test -- feed/`
- [ ] Test with 20+ item feed
- [ ] Verify no TypeScript errors
- [ ] Code review by team
- [ ] Merge to branch

### Fix 3: Disable Automatic Count Recalculation

- **File**: `src/lib/api/users/index.ts`
- **Function**: `getUserProfile()`
- **Change**: Skip count recalc, add background sync
- **Lines**: 122-173
- **Expected Savings**: 80-95% reduction

**Checklist**:

- [ ] Read implementation guide section for Fix 3
- [ ] Add `recalculateCountsInBackground()` function
- [ ] Update `getUserProfile()` to skip recalc
- [ ] Add 24-hour cache TTL logic
- [ ] Run profile tests
- [ ] Test own profile load (should be 1 read)
- [ ] Test other profile load (should be 1 read)
- [ ] Code review by team
- [ ] Merge to branch

### Fix 4: Limit User Search

- **File**: `src/lib/api/users/index.ts`
- **Function**: `searchUsers()`
- **Change**: Change limit from 1000 to 100
- **Lines**: 1035-1135
- **Expected Savings**: 90-95% reduction

**Checklist**:

- [ ] Read implementation guide section for Fix 4
- [ ] Change `limitFn(1000)` to `limitFn(100)`
- [ ] Update cap logic to `Math.min(limitCount * 3, 100)`
- [ ] Run search tests
- [ ] Test search with multiple terms
- [ ] Verify results are still accurate
- [ ] Code review by team
- [ ] Merge to branch

### Fix 5: Deploy Composite Indexes

- **Location**: Firebase Console or `firebase-indexes.json`
- **Indexes**: 2 composite indexes for sessions
- **Expected Savings**: 60-70% reduction in feed reads

**Checklist**:

- [ ] Create `firebase-indexes.json` with 2 indexes
- [ ] Index 1: sessions(visibility, createdAt)
- [ ] Index 2: sessions(userId, visibility, createdAt)
- [ ] Deploy: `npx firebase-tools deploy --only firestore:indexes`
- [ ] Wait for "READY" status in console
- [ ] Verify indexes deployed: `npx firebase-tools firestore:indexes`
- [ ] Test feed queries
- [ ] Verify query efficiency improved

---

## Testing Checklist

### Unit Tests

```bash
npm test -- src/lib/api/users/index.test.ts
npm test -- src/lib/api/sessions/posts.test.ts
npm run test:coverage -- --testPathPattern="users|sessions"
```

- [ ] All existing tests pass
- [ ] Add new batch loading tests
- [ ] Add deduplication tests
- [ ] Coverage remains >80%

### Integration Tests

```bash
npm test -- tests/integration/
```

- [ ] Follower list loading (10+ followers)
- [ ] Feed loading (20+ items)
- [ ] User profile loading
- [ ] User search (various terms)
- [ ] Follow/unfollow user

### E2E Tests

```bash
npm run test:e2e
```

- [ ] Profile page loads correctly
- [ ] Follower/following lists display properly
- [ ] Feed loads and displays correctly
- [ ] Search results appear
- [ ] No console errors

### Manual Testing

- [ ] Load own profile (should be instant)
- [ ] Load other user profiles (should be fast)
- [ ] View followers list (large follower counts)
- [ ] View following list
- [ ] Search for users (various terms)
- [ ] Load feed with 20+ items
- [ ] Test on mobile device

### Performance Testing

```bash
# Monitor read counts
npm run test:performance -- --firestore-metrics
```

- [ ] Profile view: 1 read
- [ ] Followers fetch: 2-3 reads
- [ ] Feed load (20 items): 20-25 reads
- [ ] User search: 20-50 reads

---

## Deployment Checklist

### Pre-Deployment

- [ ] All fixes implemented and tested
- [ ] All tests passing (unit, integration, e2e)
- [ ] TypeScript type-check passing: `npm run type-check`
- [ ] No ESLint errors: `npm run lint`
- [ ] Code reviewed and approved
- [ ] Indexes deployed to production
- [ ] Monitoring/alerts configured

### Deployment

- [ ] Create release branch: `release/firebase-optimization-phase1`
- [ ] Merge all optimization PRs
- [ ] Run full test suite: `npm test && npm run test:e2e`
- [ ] Deploy to staging (if applicable)
- [ ] Test staging environment
- [ ] Deploy to production
- [ ] Monitor for 24+ hours

### Post-Deployment

- [ ] Monitor Firestore read/write metrics
- [ ] Check for performance improvements
- [ ] Monitor application error rates
- [ ] Monitor latency metrics
- [ ] Document actual vs expected savings
- [ ] Share results with team

---

## Metrics to Monitor

### Firestore Metrics

```
Before → After (Target)
─────────────────────────────
Reads/hour:         2000 → 500 (75% reduction)
Writes/hour:        400 → 300 (25% reduction)
Profile read cost:  3 reads → 1 read
Feed read cost:     100 reads → 25 reads (per 20 items)
Search read cost:   1000 reads → 50 reads
```

### Application Metrics

```
Page Load Times (p95):
- Profile page:     500ms → 200ms
- Feed page:        1000ms → 300ms
- Search page:      800ms → 200ms

Error Rates:
- Firestore errors: <0.1%
- Timeout errors:   <0.05%
```

### Cost Metrics

```
Monthly Firestore Cost:
Before: ~$1,920
After:  ~$900 (Phase 1)
Final:  ~$540-840 (Full implementation)

Savings:
Phase 1: ~$1,020/month
Full:    ~$1,080-1,380/month (~$13k-16.5k/year)
```

---

## Rollback Plan

If issues occur after deployment:

1. **Monitor**: Check Firestore metrics and error rates
2. **Identify**: Determine which fix caused issue
3. **Rollback**: Revert specific fix via Git
   ```bash
   git revert <commit-hash>
   npm run build
   npm run test
   # Deploy reverted version
   ```
4. **Investigate**: Debug the issue locally
5. **Fix**: Apply fix and test thoroughly
6. **Redeploy**: Deploy fixed version

### Quick Revert Commands

```bash
# Revert specific file
git checkout <main-branch> -- src/lib/api/users/index.ts

# Revert specific commit
git revert <commit-hash>

# Force redeploy
npm run build && npm run deploy
```

---

## Sign-Off

- [ ] Database Optimization Expert: ******\_\_\_****** Date: \_\_\_
- [ ] Team Lead: ******\_\_\_****** Date: \_\_\_
- [ ] Product Manager: ******\_\_\_****** Date: \_\_\_

---

**Documentation Location**: `/FIREBASE_OPTIMIZATION_REPORT.md`
**Implementation Guide**: `/OPTIMIZATION_IMPLEMENTATION_GUIDE.md`
**Summary**: `/OPTIMIZATION_SUMMARY.txt`

**Questions?** Refer to implementation guide or contact database team.
