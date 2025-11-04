# Settings Feature Test Guide

Complete test coverage for the Ambira settings functionality following Ambira's 3-tier testing strategy.

## Overview

This guide documents comprehensive test coverage for the settings feature including:

- **Unit Tests**: Component rendering, state management, validation
- **Integration Tests**: Cross-module workflows, API coordination
- **E2E Tests**: User journeys, accessibility compliance

## Test Structure

```
tests/
├── unit/
│   └── features/settings/
│       ├── SettingsPageContent.test.tsx      # Main settings component
│       ├── NotificationSettings.test.tsx     # Notification preferences
│       └── PrivacySettings.test.tsx          # Privacy controls
├── integration/
│   └── settings/
│       ├── settings-update-flow.test.ts      # Profile/privacy updates
│       └── auth-settings-coordination.test.ts # Auth integration
└── e2e/
    ├── settings.spec.ts                      # Navigation & interactions
    └── settings-accessibility.spec.ts        # WCAG 2.0/2.1 AA compliance
```

## Unit Tests

### SettingsPageContent (`tests/unit/features/settings/SettingsPageContent.test.tsx`)

**Coverage**: 34 test cases covering:

#### Tab Navigation (5 tests)

- Renders all settings tabs (Profile, Privacy, Notifications, Display)
- Switches between tabs when clicked
- Maintains tab selection during interactions
- Handles mobile tab layout

#### Profile Form Management (9 tests)

- Initializes form with user data
- Updates form state on input changes
- Detects form changes and enables save button
- Manages social links updates
- Maintains character count displays
- Validates form field updates

#### Profile Picture Upload (6 tests)

- Displays current profile picture
- Handles successful photo upload
- Validates file type (JPEG, PNG, GIF, WebP)
- Validates file size (max 5MB)
- Handles upload errors gracefully
- Shows upload progress

#### Form Submission (5 tests)

- Submits profile form with updated data
- Shows success toast on update
- Handles API errors
- Strips undefined values before sending
- Maintains data consistency

#### Privacy Settings (2 tests)

- Displays profile visibility options
- Submits privacy settings changes

#### Account Actions (3 tests)

- Displays logout button
- Displays delete account button
- Shows delete confirmation dialog
- Handles account deletion

#### Responsive Behavior (3 tests)

- Renders desktop and mobile headers
- Displays bottom navigation on mobile
- Shows footer

#### Other Features (4 tests)

- Username is read-only
- Email display
- Membership status
- Settings initialization

**Run tests**:

```bash
npm test -- tests/unit/features/settings/SettingsPageContent.test.tsx
```

### NotificationSettings (`tests/unit/features/settings/NotificationSettings.test.tsx`)

**Coverage**: 35+ test cases covering:

#### Loading State (2 tests)

- Shows loading skeleton initially
- Loads preferences and renders content

#### Display (2 tests)

- Displays correct title and description
- Shows legend for email/in-app notifications

#### Notification Categories (3 tests)

- Social notifications section
- Activity notifications section
- Group & challenge notifications section

#### Toggle Functionality (3 tests)

- Toggles email notification switches
- Toggles in-app switches independently
- Maintains toggle state across categories

#### Save Functionality (3 tests)

- Displays save button
- Disables button while saving
- Handles save errors

#### Modal Support (2 tests)

- Renders close button in modal mode
- Calls onClose when close button clicked

#### Default Values & Accessibility (5+ tests)

- Initializes with correct defaults
- Has proper labels for toggles
- Displays descriptions for each type
- Has group posts disabled for email by default

**Run tests**:

```bash
npm test -- tests/unit/features/settings/NotificationSettings.test.tsx
```

### PrivacySettings (`tests/unit/features/settings/PrivacySettings.test.tsx`)

**Coverage**: 40+ test cases covering:

#### Loading & Initialization (3 tests)

- Shows loading skeleton
- Loads settings and renders content
- Fetches privacy settings on mount

#### Visibility Controls (9 tests)

- Profile visibility section
- Activity visibility section
- Project visibility section
- All visibility options displayed
- Updates visibility on change
- Initializes with fetched values

#### Blocked Users (4 tests)

- Renders blocked users card
- Shows empty state when no users blocked
- Displays blocked users list
- Handles unblock action

#### Save Functionality (5 tests)

- Displays save button
- Saves settings on click
- Shows success toast
- Shows error toast
- Disables button while saving

#### Modal Support (2 tests)

- Renders close button in modal mode
- Calls onClose when clicked

#### Error Handling (2 tests)

- Shows error toast if loading fails
- Renders with defaults on error

#### Accessibility & State (3+ tests)

- Has descriptive labels
- Provides context descriptions
- Maintains independent state per setting

**Run tests**:

```bash
npm test -- tests/unit/features/settings/PrivacySettings.test.tsx
```

## Integration Tests

### Settings Update Flow (`tests/integration/settings/settings-update-flow.test.ts`)

**Coverage**: 25+ test cases covering:

#### Profile Update Workflow

- Updates profile with all fields
- Handles partial updates
- Strips undefined values
- Validates email is read-only
- Handles concurrent updates

#### Profile Picture Upload Workflow

- Complete upload and update flow
- Handles upload failure
- Validates file size before upload
- Validates file type
- Prevents profile update on upload failure

#### Privacy Settings Updates

- Updates privacy settings
- Loads and applies settings
- Handles partial updates

#### Form Validation (5 tests)

- Validates name is required and non-empty
- Validates bio character limit (160 chars)
- Validates tagline character limit (60 chars)
- Validates website URL format
- Validates visibility options

#### Error Handling (3 tests)

- Handles network errors
- Handles permission errors
- Allows retry after transient error

#### Data Consistency (2 tests)

- Maintains consistency across updates
- Prevents stale reads after updates

#### Account Deletion

- Completes account deletion
- Handles deletion errors

**Run tests**:

```bash
npm test -- tests/integration/settings/settings-update-flow.test.ts
```

### Auth & Settings Coordination (`tests/integration/settings/auth-settings-coordination.test.ts`)

**Coverage**: 30+ test cases covering:

#### User Authentication Flow

- Provides user data after login
- Returns null user when not authenticated
- Synchronizes profile in settings

#### Protected Settings Access (3 tests)

- Requires authentication
- Allows access when authenticated
- Prevents unauthenticated updates

#### Profile Update Protection (2 tests)

- Prevents updating other users' profiles
- Validates user ownership

#### Session Management (3 tests)

- Preserves settings across navigation
- Clears settings on logout
- Handles session expiration

#### Logout Flow (3 tests)

- Successfully logs out user
- Clears sensitive data
- Handles logout errors

#### Account Deletion (3 tests)

- Requires authentication
- Prevents unauthenticated deletion
- Completes deletion and logs out

#### Privacy Settings Integration (2 tests)

- Loads settings for authenticated user
- Prevents access for unauthenticated users

#### Multi-Device Consistency (2 tests)

- Syncs user data across devices
- Handles concurrent updates

#### User Context Synchronization (2 tests)

- Updates form when user context changes
- Handles missing user data gracefully

**Run tests**:

```bash
npm test -- tests/integration/settings/auth-settings-coordination.test.ts
```

## E2E Tests

### Settings Page Navigation (`tests/e2e/settings.spec.ts`)

**Coverage**: 45+ test cases covering:

#### Navigation (5 tests)

- Displays all tabs
- Navigates to each tab
- Maintains tab selection
- Switches between tabs smoothly

#### Profile Settings (10 tests)

- Loads profile information
- Updates name, tagline, bio
- Enables save button on changes
- Updates social links
- Displays email as read-only
- Character counts work

#### Profile Picture Upload (3 tests)

- Displays picture section
- Shows upload button
- Displays size limit info

#### Privacy Settings (3 tests)

- Navigates to privacy tab
- Displays visibility options
- Saves privacy settings

#### Notification Settings (3 tests)

- Navigates to notifications tab
- Displays toggle switches
- Toggles preferences

#### Account Actions (4 tests)

- Displays logout button
- Displays delete button
- Shows delete confirmation
- Allows canceling deletion

#### Form Validation (4 tests)

- Prevents empty name
- Enforces tagline limit (60 chars)
- Enforces bio limit (160 chars)
- Validates URL format

#### Responsive Design (4 tests)

- Desktop layout at 1440px
- Mobile layout at 375px
- Responsive form inputs
- Stacked buttons on mobile

#### Error Handling (1 test)

- Handles update errors gracefully

#### Navigation Integration (3 tests)

- Has breadcrumbs/title
- Links to profile
- Maintains navigation history

**Run tests**:

```bash
npm test:e2e -- tests/e2e/settings.spec.ts
```

### Settings Accessibility (`tests/e2e/settings-accessibility.spec.ts`)

**Coverage**: 50+ test cases ensuring WCAG 2.0/2.1 Level AA compliance:

#### Keyboard Navigation (6 tests)

- Navigates tabs with keyboard
- Navigates form fields with Tab
- Navigates backwards with Shift+Tab
- Activates buttons with Enter
- Activates buttons with Space
- Has logical tab order

#### Screen Reader Support (7 tests)

- Form labels associated with inputs
- Tab changes announced
- Descriptive button labels
- Proper heading hierarchy
- Form errors announced
- Form submission feedback
- Required fields indicated

#### Visual Accessibility (5 tests)

- Sufficient color contrast (WCAG AA)
- Visible focus indicators
- Doesn't rely solely on color
- Text scales with zoom
- Text size >= 12px

#### Form Accessibility (6 tests)

- Form labels associated with inputs
- Related fields grouped
- Clear form instructions
- Proper input type attributes
- Character count updates
- Error messages clear

#### ARIA Attributes (5 tests)

- Proper ARIA roles
- Disabled button indication
- Icon-only button labels
- Live regions for status
- aria-describedby for help text

#### Mobile Accessibility (2 tests)

- Touch-friendly (44x44px minimum)
- Maintains focus order

#### Semantic HTML (3 tests)

- Uses semantic form elements
- Proper heading hierarchy
- Uses lists where appropriate

#### Error Prevention (3 tests)

- Clear error messages
- Prevents invalid submission
- Confirms destructive actions

**Run tests**:

```bash
npm test:e2e -- tests/e2e/settings-accessibility.spec.ts
```

## Running All Tests

### Unit & Integration Tests

```bash
# Run all settings tests
npm test -- tests/unit/features/settings/ tests/integration/settings/

# Watch mode
npm run test:watch -- tests/unit/features/settings/ tests/integration/settings/

# With coverage
npm run test:coverage -- tests/unit/features/settings/ tests/integration/settings/
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/settings-accessibility.spec.ts

# UI mode (interactive)
npm run test:e2e:ui -- tests/e2e/settings.spec.ts

# Debug mode
npm run test:e2e:debug -- tests/e2e/settings.spec.ts
```

## Coverage Targets

**Current Settings Coverage**: 80%+ target

- **SettingsPageContent**: Forms, state management, API calls
- **NotificationSettings**: Toggle states, save operations
- **PrivacySettings**: Visibility controls, error handling

**Key Coverage Areas**:

- User interactions (clicks, form inputs)
- State changes and effects
- API error handling
- Edge cases (empty fields, max lengths)
- Accessibility compliance
- Responsive behavior

## Testing Best Practices

### Unit Tests

- Test component in isolation
- Mock external dependencies (API, auth)
- Focus on user interactions
- Use semantic queries (getByRole, getByLabel)
- Test both happy path and error cases

### Integration Tests

- Test cross-module coordination
- Use realistic API mock responses
- Test data flow between features
- Verify state consistency
- Test error recovery

### E2E Tests

- Test complete user workflows
- Use real browser interactions
- Test responsive behavior
- Verify accessibility
- Test page navigation

## Common Test Patterns

### Mocking Firebase API

```typescript
jest.mock('@/lib/api', () => ({
  firebaseUserApi: {
    updateProfile: jest.fn(),
    uploadProfilePicture: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));
```

### Mocking useAuth

```typescript
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: mockUser,
    logout: jest.fn(),
  }),
}));
```

### Testing Form Input Changes

```typescript
const user = userEvent.setup();
const input = screen.getByLabel(/Name/i);
await user.clear(input);
await user.type(input, 'New Value');
expect(input).toHaveValue('New Value');
```

### Testing Toast Notifications

```typescript
await user.click(saveButton);
await waitFor(() => {
  expect(toast.success).toHaveBeenCalledWith('Saved!');
});
```

## Maintenance Notes

- Update tests when settings form structure changes
- Keep accessibility tests in sync with WCAG updates
- Monitor test execution time (target < 5s for unit tests)
- Review E2E tests when breaking UI changes occur
- Update mock data to reflect real user scenarios

## Related Documentation

- `/docs/architecture/TESTING_COVERAGE_ROADMAP.md` - Coverage targets
- `/docs/architecture/CACHING_STRATEGY.md` - React Query patterns
- `.cursor/rules/` - Coding standards
- `CLAUDE.md` - Project guidelines
