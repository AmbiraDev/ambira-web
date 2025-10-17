# Onboarding Experience Implementation

This document describes the first-time user onboarding flow for Ambira.

## Overview

The onboarding experience guides new users through Ambira's core value proposition: track work sessions, build streaks, and compete with friends. It consists of two main phases:

1. **Welcome Tour**: A multi-step modal explaining the app's features
2. **Quick Setup**: Creating the first project and starting a session

## Components

### WelcomeTour Component

**Location**: `src/components/onboarding/WelcomeTour.tsx`

A 4-step modal overlay that introduces users to Ambira:

- Step 1: Welcome to Ambira - Strava for Productivity
- Step 2: Track Your Work Sessions
- Step 3: Build Streaks & Stay Consistent
- Step 4: Compete with Friends

**Features**:
- Progress dots indicator
- Next/Back navigation
- Skip tour option
- Responsive design

### QuickSetup Component

**Location**: `src/components/onboarding/QuickSetup.tsx`

A 3-phase guided setup flow:

1. **Project Selection**: Choose from 5 suggested projects or create custom
   - Suggested projects: Work, Learning, Side Project, Fitness, Creative Work
   - Custom project option with name and description fields

2. **Project Confirmation**: Edit details before creation
   - Name field (required)
   - Description field (optional)
   - Integration with ActivitiesContext

3. **Next Steps**: Choose what to do after project creation
   - Start Session Now → Navigate to `/timer`
   - Explore Feed → Complete onboarding and go to feed

**Features**:
- Back navigation between steps
- Error handling for API failures
- Loading states during project creation
- Skip option at any point

### OnboardingFlow Component

**Location**: `src/components/onboarding/OnboardingFlow.tsx`

Orchestrates the overall onboarding experience:

- Manages step transitions (welcome-tour → quick-setup → completed)
- Handles onboarding completion in Firestore
- Provides callbacks for navigation

### OnboardingHints Component

**Location**: `src/components/onboarding/OnboardingHints.tsx`

Post-onboarding contextual hints for empty states:

**Pre-built Hints**:
- `EmptyProjectsHint`: Shown on empty projects page
- `EmptySessionsHint`: Shown on empty sessions history
- `EmptyFeedHint`: Shown when feed is empty
- `FirstTimerHint`: Shown on first timer page visit
- `FirstSessionSavedHint`: Shown after saving first session

**Features**:
- Dismissible tooltips/popovers
- localStorage persistence (hints won't re-appear once dismissed)
- Optional action buttons
- Custom hint creation via `OnboardingHint` base component

**Usage Example**:
```tsx
import { EmptyProjectsHint } from '@/components/onboarding';

<EmptyProjectsHint onCreateProject={() => setShowCreateModal(true)} />
```

**Reset Hints** (for testing):
```tsx
import { resetAllHints } from '@/components/onboarding';

resetAllHints(); // Clears all dismissed hints from localStorage
```

## Data Model

### User Type Updates

Added to `src/types/index.ts`:

```typescript
export interface User {
  // ... existing fields
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

export interface AuthUser {
  // ... existing fields
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}
```

### Firestore Structure

New user documents include:
```javascript
{
  email: "user@example.com",
  name: "User Name",
  username: "username",
  // ... other fields
  onboardingCompleted: false,
  onboardingStep: 0,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## API Methods

### firebaseAuthApi.completeOnboarding()

**Location**: `src/lib/firebaseApi.ts`

Marks onboarding as completed for the current user.

```typescript
await firebaseAuthApi.completeOnboarding();
```

### firebaseAuthApi.updateOnboardingStep(step: number)

**Location**: `src/lib/firebaseApi.ts`

Updates the current onboarding step.

```typescript
await firebaseAuthApi.updateOnboardingStep(1);
```

## Integration Points

### Home Page

**Location**: `src/app/page.tsx`

The home page checks `user.onboardingCompleted` status:

- If `false`: Shows `OnboardingFlow` component
- If `true`: Shows main feed/dashboard

```tsx
if (isAuthenticated) {
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }
  return <HomeContent />;
}
```

### Signup Flow

**Location**: `src/lib/firebaseApi.ts`

New user profiles are created with:
```javascript
onboardingCompleted: false
onboardingStep: 0
```

This applies to:
- Email/password signup (`firebaseAuthApi.signup`)
- Google Sign-In (new accounts)
- Redirect result handling (new accounts)

## Firestore Security Rules

**Location**: `firestore.rules`

Updated to allow users to update their own onboarding fields:

```javascript
match /users/{userId} {
  // Owner can read/write own profile
  allow read, write: if request.auth != null && request.auth.uid == userId;

  // ... other rules exclude onboardingCompleted and onboardingStep
  // from restricted updates, allowing the owner to modify them
}
```

## User Flow

### New User Journey

1. **Sign up** via email/password or Google
   - User document created with `onboardingCompleted: false`

2. **Redirect to home page**
   - AuthContext loads user state
   - Home component detects `onboardingCompleted: false`

3. **Welcome Tour appears**
   - User sees 4-step introduction
   - Can proceed through steps or skip

4. **Quick Setup**
   - Select or create first project
   - Choose to start session immediately or explore feed

5. **Onboarding completion**
   - `firebaseAuthApi.completeOnboarding()` sets `onboardingCompleted: true`
   - User sees main feed/dashboard

### Returning Users

- Users with `onboardingCompleted: true` skip onboarding entirely
- Contextual hints may appear on empty states (if not dismissed)

## Customization

### Adding New Tour Steps

Edit `src/components/onboarding/WelcomeTour.tsx`:

```typescript
const tourSteps = [
  // ... existing steps
  {
    title: 'New Feature',
    subtitle: 'Feature tagline',
    description: 'Feature description...',
    icon: '🎉',
  },
];
```

### Adding Suggested Projects

Edit `src/lib/onboarding/sampleProjects.ts`:

```typescript
export const suggestedProjects: SuggestedProject[] = [
  // ... existing projects
  {
    name: 'New Category',
    description: 'Category description',
    color: '#HEX_COLOR',
    icon: 'flat-color-icons:icon-name',
  },
];
```

### Creating Custom Hints

```tsx
import { OnboardingHint, type HintType } from '@/components/onboarding';

<OnboardingHint
  type="custom-hint-id" // Unique ID for localStorage
  title="Hint Title"
  message="Helpful message for the user"
  actionLabel="Take Action"
  onAction={() => console.log('Action clicked')}
/>
```

## Design Patterns

### Progressive Disclosure

- Welcome Tour → Quick Setup → Main App
- Users can skip at any point
- Hints appear contextually after onboarding

### Persistent State

- Onboarding status stored in Firestore
- Survives page refreshes and cross-device usage
- Hint dismissals stored in localStorage (device-specific)

### Graceful Degradation

- If `completeOnboarding()` fails, onboarding still proceeds
- Missing onboarding fields treated as `false` (safe defaults)
- Tour/setup can be retried if user navigates away

## Testing Checklist

- [ ] New signup triggers onboarding flow
- [ ] Returning users skip onboarding
- [ ] Skip functionality works at each step
- [ ] Project creation integrates with ActivitiesContext
- [ ] Timer navigation works after setup
- [ ] Onboarding state persists across page refreshes
- [ ] Mobile responsive on all onboarding steps
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Empty state hints show appropriately
- [ ] Hints can be dismissed and don't reappear
- [ ] Google Sign-In users see onboarding
- [ ] Firestore rules allow onboarding field updates

## Future Enhancements

- [ ] Track onboarding completion metrics
- [ ] A/B test different suggested project sets
- [ ] Add "Retake Tour" option in settings
- [ ] Progress indicator in header during setup
- [ ] Email onboarding completion notification
- [ ] Gamification: Award achievement for completing onboarding
- [ ] Analytics: Track drop-off rates at each step

## Files Modified/Created

### Created
- `src/components/onboarding/WelcomeTour.tsx`
- `src/components/onboarding/QuickSetup.tsx`
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/onboarding/OnboardingHints.tsx`
- `src/components/onboarding/index.ts`
- `src/lib/onboarding/sampleProjects.ts`
- `ONBOARDING.md` (this file)

### Modified
- `src/types/index.ts` - Added `onboardingCompleted` and `onboardingStep` fields
- `src/lib/firebaseApi.ts` - Added onboarding methods and updated user creation
- `src/app/page.tsx` - Integrated onboarding flow routing
- `firestore.rules` - Updated security rules for onboarding fields

## Support

For questions or issues with the onboarding implementation, refer to:
- This documentation
- Component source code (fully commented)
- Firebase Console for user data inspection
- Browser localStorage for hint debugging
