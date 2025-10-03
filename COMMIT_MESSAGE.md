feat: Implement comprehensive challenges system for groups

## Overview
Implemented a complete challenges feature that allows group admins to create productivity competitions and members to participate in various challenge types.

## Features Added

### Challenge Types
- **Most Activity**: Compete to log the most productive hours
- **Fastest Effort**: Achieve the best tasks-per-hour ratio  
- **Longest Session**: Record the longest single work session
- **Group Goal**: Work together to reach a collective target

### Core Components
- `ChallengeCard`: Display challenges in lists and discovery
- `ChallengeDetail`: Full challenge page with description, rules, leaderboard
- `CreateChallengeModal`: Form for admins to create challenges
- `ChallengeProgress`: Personal progress indicator with compact/full views
- `ChallengeLeaderboard`: Ranked participant list with podium display
- `GroupChallenges`: Group-specific challenges tab

### API Implementation
- Complete Firebase API for challenge CRUD operations
- Real-time progress tracking integrated with session creation
- Leaderboard calculation and ranking system
- Challenge statistics and participant management
- Automatic progress updates when sessions are logged

### Pages & Navigation
- `/challenges` - Browse and filter all challenges
- `/challenges/[id]` - Individual challenge detail pages
- Group challenges tab integration
- Right sidebar active challenges display
- Challenge discovery with search and filters

### Data Models
- Extended type definitions for challenges, progress, and leaderboards
- Challenge participant tracking with completion status
- Progress calculation for different challenge types
- Leaderboard entries with user details and rankings

### Integration Points
- Session creation automatically updates challenge progress
- Group admin permissions for challenge management
- Project filtering for challenge eligibility
- Real-time progress bars and completion detection

## Technical Details
- TypeScript interfaces for type safety
- Firebase Firestore integration with proper error handling
- Optimistic UI updates for better user experience
- Responsive design for mobile and desktop
- Comprehensive test coverage for challenge system

## Files Modified
- `src/types/index.ts` - Added challenge-related type definitions
- `src/lib/firebaseApi.ts` - Added complete challenge API methods
- `src/app/challenges/` - Challenge pages and routing
- `src/components/` - Challenge-related components
- `src/app/groups/[id]/page.tsx` - Group challenges integration
- `specs/todo.md` - Updated completion status

## Testing
- Added manual test suite for challenges system
- Verified all challenge types and data structures
- Tested API method definitions and constraints
- Validated progress calculation logic

This implementation provides a complete foundation for productivity challenges that integrates seamlessly with the existing session tracking and group systems.