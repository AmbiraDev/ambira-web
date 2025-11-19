# Updated 8-Week + Phase 2 Roadmap: Ambira with Discord Features Integrated

**Date:** November 5, 2025
**Status:** Integrated roadmap incorporating Discord-inspired features
**Positioning:** "Strava for Productivity" + "Discord for Study Sessions"

---

## Executive Overview

This document presents an **integrated roadmap** that incorporates Discord-inspired "study together" features into Ambira's existing 8-week strategic plan. The features are **integrated without timeline delay** by identifying synergies with existing roadmap items.

### Key Changes from Original Roadmap

1. **Additions (no delay):**
   - Study Commitments/Pledges (Week 1-2, with Achievements)
   - Enhanced Reactions (Week 3-4, with Leaderboards)
   - Group Chats (Week 4-6, with existing Groups)
   - Weekly Recaps (Week 6-8, with Insights)
   - Buddy Matching (Week 6-8, with Insights)

2. **Prioritization adjustments:**
   - Leaderboards prioritized earlier (Week 3-4 vs. original Week 3-4) ✓ same timing
   - PWA Foundation moved to parallel track (not sequential)
   - Testing coverage maintained at Phase 2 target (40% by Week 4)

3. **Phase 2 roadmap** (Weeks 9-16):
   - Focus Modes (browser extension)
   - Study Technique Library
   - Calendar Integration & Smart Scheduling
   - Privacy Modes (anonymous/ghost)

---

## Part 1: Integrated 8-Week Roadmap

### Week 1-2: Achievements + Study Pledges (QUICK WINS)

**Tagline:** "Get recognized. Make commitments."

**Original Features (Weeks 1-2):**

- Achievement detection logic
- Trophy case page
- 3-5 achievement types (streaks, hours, consistency)

**NEW: Study Pledges Integration**

- Pledge creation flow (morning ritual: "I commit to X hours")
- Pledge tracking during sessions
- Pledge completion notifications
- Pledge streaks (separate from session streaks)

**Why Together:**

- Achievements + pledges create motivation loop
- Achievement notif: "You crushed your pledge!"
- Both drive daily engagement + retention
- Shared Firebase collections (users/{userId}/pledges, users/{userId}/achievements)

**Deliverables:**

```
Week 1 (5 days)
- Achievement types and detection logic
- Trophy case UI component
- Pledge creation flow and data model
- Pledge progress tracking integration with session timer

Week 2 (5 days)
- Achievement unlock animations and notifications
- Pledge completion detection (end-of-session check)
- Pledge streak calculation
- Testing: Unit tests for achievement/pledge logic
```

**Success Metrics:**

- 50%+ users unlock 1+ achievement within 72h of feature launch
- 30%+ DAU create daily pledge within 7 days
- 60%+ pledge completion rate (users finish what they pledge)
- 25% increase in session starts (pledges drive pre-session motivation)

**Team:** 1 FE (trophy case, pledges UI) + 1 BE (achievement detection, pledge logic) + 0.25 QA

**Effort:** 2 weeks (same as original achievements estimate)

---

### Week 2-3: Streak Notifications + Enhanced Pledges

**Tagline:** "Don't break the chain. We'll help."

**Original Features (Weeks 2-3):**

- Daily streak-at-risk monitoring
- Notification system (smart timing)
- Customizable reminder preferences
- Streak celebration (milestones, frozen streaks)

**NEW: Pledge-Streak Integration**

- Combined notifications: "You pledged 2h. Streak at risk with 3h left."
- Pledge reminder pushes at key milestones (30 min, 2h check-ins)
- Adaptive notification frequency based on pledge completion history

**Why Together:**

- Pledges + streaks form psychological commitment device
- Loss aversion (streak at risk) + gain framing (pledge completed) = powerful
- Same notification infrastructure (Cloud Functions, Firestore listeners)
- Combined message reduces notification fatigue

**Deliverables:**

```
Week 2-3
- Cloud Function for daily 8 PM streak check
- Pledge reminder logic (30min, 2h into session)
- Combined notification messages
- User preference controls (notification time, frequency)
- Notification UI components (toast, banner)
- Testing: Integration tests for notification flow
```

**Success Metrics:**

- 40% increase in daily active streaks (users more aware)
- 50%+ opt-in rate for notifications (not aggressive)
- 80%+ of streaks are 3+ days (vs. <50% before)
- 35% reduction in skip-days (pledge + streak motivation)
- 40% higher retention for users receiving 3+ timely reminders/week

**Team:** 1 BE (Cloud Functions, notification logic) + 1 DevOps (function deployment, monitoring) + 0.25 QA

**Effort:** 1.5-2 weeks (same as original estimate)

---

### Week 3-4: Personal Leaderboards + Enhanced Reactions

**Tagline:** "See how you rank. Celebrate with reactions."

**Original Features (Weeks 3-4):**

- Weekly personal leaderboard (user vs. followers)
- Ranking display with position change indicators
- Friend comparison view
- Caching strategy (15-min refresh)

**NEW: Enhanced Reactions on Sessions**

- Emoji reactions: 🔥 (on fire), 💪 (strong), ❤️ (love), 🎯 (focus), 👏 (respect), 🚀 (momentum)
- One-click reaction picker on session cards
- Reaction counts displayed below sessions
- Reaction aggregation for notifications
- **Leaderboard scoring includes reactions:** (hours × 0.5) + (reactions × 0.1)

**Why Together:**

- Reactions increase session engagement (40% more interaction than "like")
- Reaction counts signal quality sessions on leaderboards
- Motivational feedback: See peer validation in real-time
- Same feed architecture (sessions/{sessionId}/reactions)

**Deliverables:**

```
Week 3
- Personal leaderboard calculation service
- Leaderboard caching (Redis or Firestore denormalization)
- Leaderboard UI components (table, card views)
- Mobile optimization for leaderboard scrolling

Week 4
- Emoji reaction picker component
- Reaction aggregation and storage
- Leaderboard scoring updated for reactions
- Real-time reaction counts (Firestore listeners)
- Notification on reaction receipt (batched hourly)
- Testing: Integration tests for leaderboard + reactions
```

**Success Metrics:**

- 60% DAU check leaderboard weekly (vs. 30% without feature)
- 40% interaction rate on sessions (reactions vs. previous "like")
- +25% time spent on feed (discovery of reactions)
- 3x session logging during peak leaderboard times
- Leaderboard check correlates with 2x session frequency

**Team:** 1 FE (leaderboards, reactions UI) + 1 BE (leaderboard calc, reaction storage) + 0.25 QA

**Effort:** 2 weeks (same as original estimate)

---

### Week 4-6: Global Leaderboards + Group Chats + PWA Foundation

**Tagline:** "Compete globally. Study together. App on your home screen."

**Original Features (Weeks 4-6):**

- Global leaderboards (top 100 users)
- Activity-specific leaderboards
- Geographic leaderboards (by region)
- PWA fundamentals (manifest, service worker, offline capability)
- Mobile-first refinements

**NEW: Group Chat Channels**

- Text chat within study groups
- Real-time message updates
- Message history and search
- @mentions for notifications
- Moderation (admin delete, report spam)
- Session shares in chat (auto-links to session details)

**Why Together:**

- Global leaderboards create aspirational targets
- Group chats create accountability + community
- PWA makes mobile experience first-class
- All three drive daily engagement and retention

**Technical Synergies:**

- Leaderboard listeners (Firestore) + chat listeners (same pattern)
- Group feature existing (just add messaging subcollection)
- PWA service worker used for chat offline queueing

**Deliverables:**

```
Week 4
- Global leaderboard calculation and caching
- Leaderboard UI (top 100, activity filters)
- Group chat data model (messages/{messageId})
- Real-time message listeners (React Query + Firestore)

Week 5
- Group chat UI component (message list, input)
- @mention detection and notification trigger
- Message moderation (delete, report)
- Chat search functionality
- PWA manifest.json and icon assets

Week 6
- Service worker implementation (offline capability)
- Cache strategy (network-first for API, cache-first for assets)
- Session offline queue (queues during offline, syncs when online)
- Install prompt (iOS/Android detection)
- Testing: Integration tests for chat + leaderboards
```

**Success Metrics:**

- 70%+ of active users view global leaderboards weekly
- 3x session logging during peak leaderboard competition times
- 80% daily active rate for group chat members
- 2x session frequency increase for group chat users
- 3x retention improvement for chat-active users
- 40%+ of new sessions logged from PWA
- 60%+ DAU retention for PWA installers (vs. 30% web)

**Team:** 1 FE (leaderboards, chat UI) + 1 FE (group chat, PWA) + 1 BE (chat API, offline sync) + 0.5 DevOps (PWA optimization)

**Effort:** 2-3 weeks (distributed across 3-week window)

---

### Week 6-8: Insights + Weekly Recaps + Buddy Matching + Smart Scheduling

**Tagline:** "Improve together. Weekly wins. Find your study buddy."

**Original Features (Weeks 6-8):**

- Actionable insights generation (best time, productivity patterns)
- Personalized recommendations
- Weekly recap (email + in-app)
- Batch processing pipeline (Cloud Functions)

**NEW: Weekly Recaps (Spotify Wrapped-style)**

- Email weekly summary with achievements, streaks, hours
- Shareable achievement cards (tweet/LinkedIn ready)
- Annual recap at year-end
- Social sharing drives viral growth

**NEW: Buddy Matching System**

- Matching algorithm (activity preferences, schedule, time zone)
- Buddy profile and relationship tracking
- "You've studied together X times" stat
- Buddy challenges (optional 3-day pledges)
- Buddy notifications ("Emma started studying!")

**NEW: Smart Scheduling**

- Analyze historical session times, suggest blocks
- "You usually study 2-3 PM. Want to block that on calendar?"
- Calendar integration groundwork (OAuth setup)

**Why Together:**

- All share same data aggregation pipeline
- Insights → recommendations + buddy suggestions
- Weekly recap → shareable cards → viral growth
- Buddy matching uses activity/schedule data from insights

**Technical Synergies:**

- Cloud Functions batch job runs once/week (efficiency)
- React Query cache used for buddy queries (pattern consistency)
- Email infrastructure (Mailgun) for recaps + notifications
- Firestore listeners for buddy status updates

**Deliverables:**

```
Week 6
- Insights calculation service (historical data aggregation)
- Buddy matching algorithm (similarity scoring)
- Weekly recap generation (Cloud Function)
- Email template design and implementation

Week 7
- Shareable recap card UI (frontend)
- Buddy suggestion carousel (matching UI)
- Buddy request flow (send, accept, decline)
- Buddy-specific leaderboard (Emma vs. You)
- Smart scheduling suggestion logic

Week 8
- Real-time buddy status listener (online, studying)
- Buddy notifications (session start alert)
- Calendar integration research + OAuth setup
- Testing: Unit tests for matching algorithm
- Testing: Integration tests for recap email flow
```

**Success Metrics:**

- 50%+ users engage with insights (view recommendations)
- 45% weekly recap email open rate (strong engagement)
- 30% click-through rate on recommendations
- 35% of weekly recaps shared socially (viral coefficient 1.2)
- 25% increase in users trying new activities (recommendation impact)
- 30% of DAU try buddy matching
- 60% of matched pairs study together within 7 days (buddy retention)
- 40% buddy pair churn reduction vs. solo users

**Team:** 1 FE (recaps, buddy UI) + 1 BE (insights algorithm, buddy matching) + 0.25 QA + 0.25 DevOps (email infra)

**Effort:** 2-3 weeks (distributed across 3-week window)

---

### Parallel Track: Testing Infrastructure (All 8 Weeks)

**Goal:** Increase test coverage from 11.74% → 40% (Phase 2 target)

**Phase 2 Coverage Roadmap:**

| Area              | Coverage Target | Tests Needed     | Effort         |
| ----------------- | --------------- | ---------------- | -------------- |
| Sessions API      | 60%             | 15 new tests     | 3-4 days       |
| Users API         | 50%             | 12 new tests     | 3-4 days       |
| Challenges API    | 55%             | 10 new tests     | 2-3 days       |
| Groups API        | 60%             | 6 new tests      | 2 days         |
| React Query Hooks | 40%             | 8 new tests      | 2 days         |
| **TOTAL**         | **40%**         | **51 new tests** | **12-17 days** |

**Test Distribution by Week:**

- Week 1-2: Sessions API (create, read, update, delete)
- Week 3-4: Users API + Groups API
- Week 5-6: Challenges API + React Query hooks
- Week 7-8: Integration tests + coverage cleanup

**Team:** 0.5 QA/Testing engineer (dedicated)

**Deliverables by Week 8:**

- 40% statement coverage across critical APIs
- 50%+ coverage on sessions, users, challenges, groups
- 521 tests → 572 tests (+51 new tests)
- All new features have >80% coverage

---

## Part 2: 8-Week Summary Timeline

```
WEEK 1-2: QUICK WINS (Achievements + Pledges)
├─ Achievements: Detection, trophy case, unlock animations
├─ Pledges: Creation, tracking, completion detection
└─ Testing: Achievement/pledge unit tests → 12% coverage

WEEK 2-3: RETENTION LAYER (Streak Notifications + Pledge Integration)
├─ Streak monitoring: Daily 8 PM check, Cloud Function
├─ Notifications: Smart timing, combined messages
├─ Pledge reminders: 30min, 2h check-ins during sessions
└─ Testing: Notification flow integration tests → 14% coverage

WEEK 3-4: SOCIAL LAYER (Personal Leaderboards + Reactions)
├─ Leaderboards: Weekly personal ranking vs. followers
├─ Reactions: Emoji picker (🔥 💪 ❤️ 🎯 👏 🚀)
├─ Scoring: Reactions included in leaderboard algorithm
└─ Testing: Leaderboard + reaction unit/integration tests → 18% coverage

WEEK 4-6: SCALE + COMMUNICATION (Global Leaderboards + Group Chats + PWA)
├─ Global leaderboards: Top 100, activity-specific, region-specific
├─ Group chats: Real-time messaging, @mentions, moderation
├─ PWA: Service worker, offline capability, install prompt
└─ Testing: Chat API tests, PWA integration tests → 25% coverage

WEEK 6-8: PERSONALIZATION + VIRAL (Insights + Recaps + Buddy System + Scheduling)
├─ Insights: Historical analysis, recommendations
├─ Weekly recaps: Email summary + shareable cards
├─ Buddy matching: Algorithm, suggestions, buddy tracking
├─ Smart scheduling: Calendar integration groundwork
└─ Testing: Algorithm unit tests, email flow tests → 40% coverage

PARALLEL (All 8 weeks): TESTING COVERAGE
└─ Phase 2 target: 11.74% → 40% coverage
```

---

## Part 3: Phase 2 Roadmap (Weeks 9-16)

Post-MVP Discord feature completions and advanced integrations.

### Week 9-10: Focus Modes (Browser Extension + Native App Groundwork)

**Tagline:** "Block distractions. Own your focus time."

**Features:**

- Browser extension for website blocking (Chrome, Firefox)
- Blocklist management (Reddit, Twitter, YouTube, etc.)
- Whitelist allowed sites (course materials, GitHub, etc.)
- "Enable Focus Mode" during session (one-click)
- Focus session tracking (uninterrupted study blocks)
- Cannot disable during session (commitment device)

**Effort:** 2 weeks (1 FE + 1 BE for extension + backend)

**Success Metrics:**

- 25% DAU install browser extension
- 40% of sessions use focus mode
- 60% reduction in app-switching during sessions
- 50% increase in average session length

---

### Week 11-12: Study Technique Library + Template Goals

**Tagline:** "Learn how to study smarter."

**Features:**

- Study technique guides (Pomodoro, Feynman, spaced repetition, etc.)
- Best practices for different subjects
- Template goals ("Prepare for MCAT: 300 hours")
- Expert tips from top-performing users
- Goal templates reduce friction (quick goal setup)

**Effort:** 2 weeks (1 Content creator + 1 FE for UI)

**Success Metrics:**

- 50% of new users select template goal
- 75% of users read ≥1 study technique
- 65% of users with study technique guidance complete goals (vs. 40% without)

---

### Week 13-14: Calendar & Learning Platform Integrations

**Tagline:** "Your calendar + your courses, all in one place."

**Features:**

- Two-way Google Calendar sync (display sessions, import events)
- Canvas LMS integration (pull deadlines, auto-create goals)
- Coursera integration (display course progress, suggest study sessions)
- Assignment deadline detection and countdown
- "Study for Exam on Nov 15" goal creation
- Exam date countdown timer

**Effort:** 2.5 weeks (1 BE for integrations + 1 FE for UI)

**Success Metrics:**

- 35% of users connect calendar
- 45% of users import learning platform deadlines
- 55% conversion: Deadline → study session created
- 30% increase in goal completion (deadline-driven accountability)

---

### Week 15-16: Privacy Modes + Advanced Features

**Tagline:** "Study on your terms. Track privately."

**Features:**

- Ghost mode: Track sessions without posting to feed
- Anonymous group joining: Study with groups without revealing identity
- Per-activity privacy: Hide sensitive activities (therapy prep, job search)
- Private leaderboards: Compete only with close friends
- Verified study hours (for internship/scholarship applications)

**Effort:** 1.5-2 weeks (1 FE + 1 BE for privacy logic)

**Success Metrics:**

- 15% of sessions in private mode (privacy use case validation)
- 20% of users join group anonymously at least once
- 10% of users apply verified study hours to applications

---

## Part 4: Resource & Budget Allocation

### FTE Allocation (8-Week Timeline)

```
Frontend Engineers:
- Week 1-2: Achievements + Pledges UI (1 FE)
- Week 2-3: Notification UI (0.5 FE)
- Week 3-4: Leaderboards + Reactions (1 FE)
- Week 4-6: Group Chat UI + PWA (1 FE)
- Week 6-8: Insights UI + Buddy UI + Recaps (1 FE)
TOTAL: 2.5 FTE (peak in Week 4-6)

Backend Engineers:
- Week 1-2: Achievement/Pledge logic (1 BE)
- Week 2-3: Notification system (1 BE)
- Week 3-4: Leaderboard calculation (1 BE)
- Week 4-6: Chat API + Offline sync (1 BE)
- Week 6-8: Insights pipeline + Buddy matching (1 BE)
TOTAL: 2.5 FTE (peak in Week 4-6)

QA / Testing:
- All 8 weeks: Test coverage (Phase 1 → Phase 2)
TOTAL: 0.5 FTE

DevOps:
- Week 2-3: Cloud Functions setup (0.25)
- Week 4-6: PWA optimization, monitoring (0.5)
- Week 6-8: Email infrastructure, scaling (0.25)
TOTAL: 0.5 FTE

Total Headcount: 2.5 FE + 2.5 BE + 0.5 QA + 0.5 DevOps = 5.5 FTE
```

### Budget Estimate

```
Engineering Cost:
- 5.5 FTE × $250/hr × 320 hours/8 weeks = $440,000

Infrastructure Cost:
- Firebase (Firestore, Cloud Functions): $800
- Email service (Mailgun, SendGrid): $200/month = $1,600 (8 months)
- CDN + storage optimization: $400
- Monitoring (Sentry, DataDog): $200/month = $1,600
TOTAL INFRASTRUCTURE: $5,000

Third-party integrations:
- Calendar APIs (Google, Apple): Free tier sufficient
- LMS integrations (Canvas, Coursera): Free tier for MVP
TOTAL INTEGRATIONS: $0

TOTAL 8-WEEK BUDGET: $445,000
```

---

## Part 5: Success Metrics & KPIs

### Primary North Star Metrics

| Metric                     | Week 0 | Week 4 | Week 8 | Target |
| -------------------------- | ------ | ------ | ------ | ------ |
| **DAU**                    | 2,000  | 2,500  | 4,000+ | +100%  |
| **D7 Retention**           | 40%    | 43%    | 50%+   | +25%   |
| **D30 Retention**          | 20%    | 22%    | 30%+   | +50%   |
| **Avg Sessions/User/Week** | 2.0    | 3.5    | 6.0+   | 3x     |

### Feature Adoption Metrics

| Feature            | Week 2 | Week 4 | Week 6 | Week 8 | Target         |
| ------------------ | ------ | ------ | ------ | ------ | -------------- |
| **Achievements**   | 30%    | 50%    | 60%    | 70%    | 60%+ by Week 2 |
| **Pledges**        | 15%    | 30%    | 40%    | 50%    | 30%+ by Week 4 |
| **Leaderboards**   | -      | 50%    | 65%    | 75%    | 60%+ by Week 4 |
| **Group Chats**    | -      | -      | 60%    | 80%    | 70%+ by Week 6 |
| **Buddy Matching** | -      | -      | 20%    | 35%    | 25%+ by Week 8 |
| **Weekly Recaps**  | -      | -      | -      | 50%    | 50%+ opt-in    |

### Quality Metrics

| Metric                | Week 0 | Week 4 | Week 8 |
| --------------------- | ------ | ------ | ------ |
| **Test Coverage**     | 11.74% | 25%    | 40%    |
| **Page Load Time**    | 2.5s   | 2.0s   | <1.5s  |
| **API Response Time** | 800ms  | 500ms  | <400ms |
| **Error Rate**        | 0.2%   | 0.1%   | <0.05% |

### Engagement Loop Metrics

| Metric                     | Definition                                 | Target |
| -------------------------- | ------------------------------------------ | ------ |
| **Pledge Completion %**    | Pledges fulfilled by day-end               | 60%+   |
| **Streak Maintenance %**   | Users with 7+ day streaks                  | 50%+   |
| **Leaderboard Check Rate** | % DAU who view leaderboards weekly         | 70%+   |
| **Chat Daily Active %**    | % of group members active in chat daily    | 80%    |
| **Buddy Engagement %**     | % of buddy pairs who study together weekly | 60%+   |

---

## Part 6: Risk Assessment & Mitigation

### Feature-Specific Risks

| Risk                                                 | Severity | Mitigation                                                        |
| ---------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| **Pledge fatigue** (users tired of daily commitment) | MEDIUM   | A/B test frequency, default weekly not daily                      |
| **Leaderboard toxicity** (competitive burnout)       | LOW      | Add "friends-only" private leaderboards, emphasize personal best  |
| **Chat moderation burden**                           | MEDIUM   | Auto-delete profanity, require opt-in community standards         |
| **PWA adoption slow**                                | MEDIUM   | Focus on offline capability as value prop, add native app roadmap |
| **Buddy matching low adoption**                      | MEDIUM   | Manual matching initially (cold-start), AI matching Phase 2       |
| **Calendar integration complexity**                  | LOW      | Start with Google Calendar only, expand Phase 2                   |

### Market Risks

| Risk                                          | Severity | Mitigation                                                                |
| --------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| **Student TAM overestimated**                 | MEDIUM   | User research with 20 students before Week 1, validate 70% want features  |
| **Positioning shift confuses existing users** | MEDIUM   | Communicate "Strava + Discord" (not complete pivot), keep Strava language |
| **Group features increase support burden**    | LOW      | Proactive moderation, auto-filters, community guidelines                  |
| **Privacy concerns (pledges visibility)**     | LOW      | Default pledges private, users opt-in to visibility                       |

### Technical Risks

| Risk                                                     | Severity | Mitigation                                                         |
| -------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| **Chat real-time performance at scale**                  | MEDIUM   | Load test with 1000 concurrent users, implement message pagination |
| **Leaderboard calculation bottleneck**                   | LOW      | Cache 15min, use denormalized collections, batch updates           |
| **Browser extension approval delays** (Chrome Web Store) | LOW      | Submit Week 8, have contingency PWA focus mode                     |
| **Service worker offline sync complexity**               | LOW      | Start simple (text-only), expand Phase 2                           |

---

## Part 7: Execution Checklist

### Pre-Execution (Week 0)

- [ ] Product/Engineering alignment on Discord feature set (24h)
- [ ] User research with 10 students, 5 professionals (validate demand)
- [ ] Technical spike on group chat real-time architecture (1 week)
- [ ] Detailed feature specs for Week 1-2 pledges + achievements
- [ ] Design system updates (emoji reactions, pledge UI, buddy cards)
- [ ] Analytics instrumentation plan (track all KPIs)

### Week 1-2

- [ ] Achievements: Unlock logic, trophy case UI, animations
- [ ] Pledges: Creation flow, tracking, completion detection
- [ ] Testing: Achievement/pledge unit tests (>80% coverage for new code)
- [ ] Deploy: Web app with achievements + pledges to staging
- [ ] Launch: Roll out to 10% of users (beta test)

### Week 2-3

- [ ] Streak notifications: Cloud Function, notification UI
- [ ] Pledge integration: Combined messages, reminder timing
- [ ] Testing: Integration tests for notification flow
- [ ] Deploy: Notification system to production
- [ ] Monitor: Notification open rates, opt-in rates

### Week 3-4

- [ ] Leaderboards: Calculation service, UI, caching
- [ ] Reactions: Emoji picker, reaction storage, aggregation
- [ ] Testing: Leaderboard + reaction tests
- [ ] Deploy: Leaderboards + reactions to production
- [ ] Monitor: Leaderboard engagement, reaction engagement

### Week 4-6

- [ ] Global leaderboards: Expansion, activity filters, top 100
- [ ] Group chats: Message API, real-time listeners, moderation
- [ ] PWA: Service worker, manifest, offline capability
- [ ] Testing: Chat API tests, PWA integration tests
- [ ] Deploy: Each feature separately (modular rollout)
- [ ] Monitor: Chat DAU, PWA install rate, performance

### Week 6-8

- [ ] Insights: Data pipeline, calculation service
- [ ] Weekly recaps: Email templates, shareable cards
- [ ] Buddy matching: Algorithm, matching UI, notifications
- [ ] Smart scheduling: Historical analysis, calendar groundwork
- [ ] Testing: Algorithm tests, email flow tests
- [ ] Deploy: Features to production (phased rollout)
- [ ] Launch: Marketing campaign ("Study together" theme)

### Ongoing (All 8 weeks)

- [ ] Testing: Phase 2 coverage (40% target)
- [ ] Monitoring: KPI dashboards, feature adoption
- [ ] User feedback: Weekly research sessions with active users
- [ ] Performance: Page load <2s, API <500ms
- [ ] Quality: Error rate <0.1%, no critical bugs blocking deployment

---

## Conclusion

This **integrated 8-week roadmap** incorporates Discord-inspired "study together" features without delaying existing priorities. By identifying synergies with existing roadmap items (Achievements + Pledges, Streaks + Notifications, Leaderboards + Reactions, Groups + Chats, Insights + Recaps), we can deliver a **comprehensive social productivity platform** that competes with both Strava and Discord.

**Key deliverables by Week 8:**

- ✓ Achievements + Pledges (motivation + commitment)
- ✓ Streak Notifications + Pledge Integration (retention)
- ✓ Leaderboards + Reactions (competition + social)
- ✓ Global Leaderboards + Group Chats + PWA (scale + communication + mobile)
- ✓ Insights + Recaps + Buddy Matching (personalization + viral + lock-in)
- ✓ 40% test coverage (quality assurance)

**Expected outcome:**

- DAU: 2,000 → 4,000+ (100% growth)
- D7 Retention: 40% → 50%+ (25% improvement)
- Avg Sessions/User: 2 → 6+ (3x increase)
- Positioning: "Strava for Productivity" + "Discord for Study Sessions"
- TAM Expansion: 3.5M → 15.5M (440% growth potential)

---

**Document Version:** 2.0 (Integrated with Discord Features)
**Status:** Ready for execution
**Review Date:** November 5, 2025
**Next Review:** December 5, 2025 (after Week 4 milestone)
