  ---
  🎮 ESSENTIAL GAMIFICATION (Add Value)

  6. Add Starter Achievements

  Implement 5 basic achievements that unlock automatically:
  1. "First Session" - Complete your first session
  2. "Week Warrior" - Maintain a 7-day streak
  3. "Productive Week" - Complete 10+ hours in a single week
  4. "Dedicated" - Reach 50 total hours across all projects
  5. "Social Butterfly" - Follow 5 users

  Add achievement badges to user profiles and show unlock notifications when earned. Keep it simple - no complex
  trophy case or animations yet.


  ---
  👤 ONBOARDING & UX (First Impressions)

  8. Create Onboarding Flow

  Build a simple onboarding flow for new users after signup that:
  1. Welcomes them to Ambira
  2. Guides them to create their first project
  3. Prompts them to start their first timer session or record a manual entry
  4. Shows them how to navigate the feed and discover users

  Keep it to 3-4 steps max. Store onboarding completion status so users don't see it again. Make it skippable but
  encourage completion.

  9. Improve Empty States

  Audit all empty states in the app (empty feed, no projects, no followers, etc.) and make them more encouraging and
  actionable. Each empty state should:
  - Have friendly copy that encourages action
  - Include a clear CTA button
  - Avoid highlighting what the user is "missing"
  - Focus on what they can do next

  Key pages to update: feed, projects page, profile tabs, groups, challenges.

  ---
  🔍 SEARCH & DISCOVERY (Performance)

  10. Fix Group/Challenge Search

  The group and challenge search currently loads ALL items and filters client-side. Refactor the search to:
  - Query Firestore with search parameters server-side
  - Limit results to 20-50 items
  - Use proper indexes for efficient queries
  - Add pagination if needed

  Update both /search page and /groups, /challenges pages to use server-side filtering.

  11. Improve User Discovery Algorithm

  Enhance the user suggestion algorithm in firebaseUserApi.getSuggestedUsers() to:
  - Prioritize users with recent activity (sessions in last 7 days)
  - Show users working on similar project types
  - Include mutual followers when available
  - Exclude inactive users (no sessions in 30+ days)

  Keep the suggestions feeling curated and relevant, not just a random list.

  ---
  🖼️ VISUAL POLISH (Details Matter)

  12. Fix Profile Picture Display

  Audit the entire app to ensure profile pictures display consistently everywhere:
  - User cards in suggestions/search
  - Comments and replies
  - Session feed cards
  - Group member lists
  - Challenge leaderboards
  - Header when logged in

  Ensure the upload functionality works properly and images are optimized/resized for performance.

  13. Add Loading States Everywhere

  Add proper loading skeletons and states to all pages that fetch data:
  - Feed loading (show skeleton cards)
  - Profile loading (skeleton header + tabs)
  - Groups/challenges loading
  - Search results loading
  - Analytics loading

  Use shimmer effects or pulse animations. Never show blank pages while loading.

  ---
  📊 ANALYTICS & MONITORING (Know What's Happening)

  14. Add Basic Analytics Events

  Set up basic analytics tracking (using Vercel Analytics or a simple event system) for key user actions:
  - User signup
  - First session created
  - Session completed
  - User followed
  - Group joined
  - Challenge joined
  - Achievement unlocked

  Track these events so you can monitor user engagement after launch. Keep it privacy-friendly - no PII.

  15. Set Up Error Monitoring Dashboard

  You have Sentry integrated - now configure it properly:
  - Set up error alerting for critical errors
  - Create custom error grouping for common issues
  - Add source maps for better debugging
  - Set up a basic dashboard to monitor error rates

  Test it by triggering a sample error and verifying it appears in Sentry.

  ---
  ✅ FINAL CHECKS (Pre-Launch)

  16. Security & Privacy Audit

  Review all Firestore security rules and ensure:
  - Users can only edit their own data
  - Session visibility rules are enforced (private/followers/everyone)
  - Group admins have proper permissions
  - No sensitive data is exposed in API responses
  - Rate limiting is in place where needed

  Test by trying to access/modify data you shouldn't have access to when logged in as different users.

  17. Performance Optimization Pass

  Run performance audits and optimize:
  - Check bundle size (use `npm run build` and review output)
  - Optimize images (use Next.js Image component everywhere)
  - Add proper caching headers for static assets
  - Lazy load components that aren't immediately visible
  - Run Lighthouse audit and fix issues scoring below 80

  Focus on mobile performance - that's where users will notice slow loads most.

  18. Create Admin Tools

  Build a simple admin page at /admin (protected, only you can access) that lets you:
  - View total user count and recent signups
  - See recent sessions across all users
  - Monitor group/challenge creation
  - Delete spam or inappropriate content
  - View error logs from Sentry

  Keep it basic - you'll need this for managing the platform after launch.

  ---
  🌱 SEED DATA (Make It Feel Alive)

  19. Seed Your Own Profile

  I need to manually create realistic seed data for my own profile. Guide me through:
  1. Creating 3-4 realistic projects (varied types: work, learning, fitness, creative)
  2. Using the manual entry feature to backdate 15-20 sessions over the past 2 weeks
  3. Building a 7-day current streak
  4. Adding a complete bio and profile information
  5. Creating 1-2 public groups with clear purposes
  6. Creating 1-2 active challenges

  Provide realistic example data for project names, session descriptions, and group/challenge details.

  ---
  📝 DOCUMENTATION (Help Users & Yourself)

  20. Create Help/FAQ Page

  Create a simple help page at /help with:
  - "What is Ambira?" explanation
  - "How do I track a session?" guide
  - "What are streaks?" explanation
  - "How do groups work?" guide
  - "How do challenges work?" guide
  - "Privacy settings" explanation
  - Contact/feedback link

  Keep each section to 2-3 sentences max. Make it scannable with clear headings.
