# Firebase Operations Analysis - Documentation Index

This directory contains comprehensive analysis of Firebase operations in the Ambira codebase.

## Quick Navigation

### For Quick Overview

Start here: **FIREBASE_QUICK_REFERENCE.md** (5 min read)

- High-priority files to monitor
- Current issues identified (3)
- Performance recommendations
- Code review checklist

### For Detailed Analysis

Read: **FIREBASE_ANALYSIS.md** (15 min read)

- Complete Firebase operations audit
- All 60+ Firebase files listed
- 30+ query patterns catalogued
- Real-time listeners review
- N+1 pattern identification
- Transaction pattern analysis
- Firestore collection structure
- Recommendations (immediate & medium-term)

### For File Organization

Reference: **FIREBASE_FILE_INVENTORY.md** (10 min read)

- Complete directory structure
- Activity categorization (High/Medium/Low)
- Query pattern distribution
- Collection access patterns
- Summary statistics

---

## Executive Summary

**Overall Health Score: 8/10** ✅

The Ambira codebase demonstrates mature Firebase integration with:

- Clean architecture (repositories + mappers + services)
- React Query at feature boundaries
- Proper error handling and rate limiting
- Correct transaction patterns
- Efficient batch operations

**3 Issues Identified:**

1. **N+1 in legacy posts.ts** (getUserPosts) - HIGH priority
2. **N+1 in useGroupMembers** (parallelized) - MEDIUM priority
3. **Feed query multiplier** (3x fetch) - MEDIUM priority

---

## Key Statistics

| Metric                   | Count       |
| ------------------------ | ----------- |
| Firebase-related files   | 60+         |
| Firebase-related code    | 5000+ lines |
| Firestore query patterns | 30+         |
| Real-time listeners      | 2           |
| Batch operations         | 5           |
| Transactions             | 2           |
| React Query hooks        | 15+         |
| API modules              | 10+         |
| Services                 | 8+          |

---

## Cloud Functions

**Status:** ❌ **NONE FOUND**

All Firebase operations execute client-side through:

- Firebase SDK v9 (modular imports)
- React Query for caching
- Direct API modules

---

## Real-Time Operations

### Active Listeners (2)

1. **useNotifications.ts** - User's notifications (persistent)
2. **posts.ts:listenToSessionUpdates()** - Session support counts (throttled to 10)

### Periodic Polling (1)

- **Feed.tsx** - Check for new sessions every 2 minutes

---

## Query Patterns

### Simple Operations

- `getDoc()` - Single document reads (~30 locations)
- `getDocs()` - Collection queries (~20 locations)
- `query()` with WHERE - Filtering (~20 locations)

### Complex Operations

- Feed queries - 7 different types (posts.ts)
- Pagination - Cursor-based with startAfter()
- Transactions - Follow/unfollow, support actions
- Batch operations - Bulk writes (challenges, notifications)

---

## Problem Areas

### High Priority (Monitor)

1. **posts.ts (1099 lines)** - Legacy API file with N+1 pattern
2. **auth/index.ts** - Username generation loop (up to 999 queries)
3. **useGroupMembers.ts** - N+1 pattern (parallelized)

### Medium Priority

1. Feed polling frequency
2. Group member query performance
3. Username suggestion algorithm

### Low Priority

All other Firebase operations well-optimized

---

## Recommendations

### Immediate Actions

1. Create Firestore composite indexes (2 recommended)
2. Monitor posts.ts usage and plan refactor
3. Add query logging for performance tracking

### Medium-Term

1. Consolidate feed queries from legacy posts.ts
2. Optimize group members with caching
3. Review username generation algorithm

### Already Implemented (Keep)

- Repository pattern for infrastructure
- React Query at feature boundaries
- Proper error handling
- Rate limiting on auth
- Transaction safety
- Batch operations
- Listener cleanup

---

## File Categories

### 🔴 High Activity (Monitor)

- src/lib/api/sessions/posts.ts
- src/lib/api/auth/index.ts
- src/lib/api/social/helpers.ts
- src/components/Feed.tsx
- src/hooks/useNotifications.ts
- src/features/groups/hooks/useGroupMembers.ts

### 🟡 Medium Activity

- src/lib/api/challenges/index.ts
- src/lib/api/notifications/index.ts
- All repository classes
- All feature services

### 🟢 Low Activity (Optimized)

- src/lib/firebase.ts
- Infrastructure mappers
- Shared utilities

---

## Firestore Collections

```
collections:
  ├── users                    - User profiles
  ├── sessions                 - Activities/posts
  ├── projects                 - User projects
  ├── groups                   - Social groups
  ├── groupMemberships         - Group membership tracking
  ├── social_graph             - Follow relationships
  ├── challenges               - Challenge definitions
  ├── challengeParticipants    - Challenge participants
  ├── notifications            - User notifications
  ├── comments                 - Activity comments
  ├── streaks                  - Streak tracking
  ├── follows                  - Deprecated
  └── posts                    - Deprecated (use sessions)
```

---

## Best Practices Observed

- ✅ Repositories abstract Firestore implementation
- ✅ Mappers handle data transformation
- ✅ Services orchestrate business logic
- ✅ React Query manages cache at boundaries
- ✅ Transactions follow read-then-write pattern
- ✅ Real-time listeners properly cleaned up
- ✅ Batch operations for bulk writes
- ✅ Rate limiting on sensitive operations
- ✅ Error handling includes permission checks
- ✅ Auth state managed centrally

---

## Monitoring & Alerts

### Watch For

- Increasing reads in posts.ts
- Rapid username checks (rate limit bypass)
- Large group member list queries
- Feed polling frequency changes

### Metrics to Track

- Firestore read quota usage
- Real-time listener count
- N+1 pattern occurrences
- Feed pagination cursor generation

---

## Code Review Checklist

When reviewing Firebase changes:

- [ ] No new `onSnapshot()` without cleanup?
- [ ] No loops with Firestore queries?
- [ ] Rate limiting applied for user actions?
- [ ] React Query cache used at boundaries?
- [ ] Transactions follow read-then-write?
- [ ] Batch operations for bulk writes?
- [ ] Error handling includes permissions?
- [ ] Memory cleanup for listeners?

---

## Documentation Files

1. **This file (FIREBASE_README.md)** - Navigation and summary
2. **FIREBASE_ANALYSIS.md** - Detailed technical analysis (313 lines)
3. **FIREBASE_FILE_INVENTORY.md** - Complete file listing (347 lines)
4. **FIREBASE_QUICK_REFERENCE.md** - Quick lookup guide (198 lines)

---

## Next Steps

1. Read FIREBASE_QUICK_REFERENCE.md for monitoring points
2. Review FIREBASE_ANALYSIS.md for detailed findings
3. Create Firestore composite indexes
4. Plan migration of legacy posts.ts
5. Add query monitoring

---

## Questions?

Refer to:

- **Architecture decisions:** `/docs/architecture/` directory
- **API implementation:** `src/lib/api/` directory
- **Repositories:** `src/infrastructure/firebase/` directory
- **Hooks:** `src/features/*/hooks/` and `src/hooks/`

---

Generated: November 3, 2025
Analysis tool: Claude Code
