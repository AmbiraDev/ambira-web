# Unit Tests Guide

Detailed guide for writing unit tests in the Ambira test suite.

## Overview

Unit tests verify individual components, hooks, and functions in isolation. They should be:

- **Fast**: Complete in milliseconds
- **Focused**: Test one behavior at a time
- **Independent**: No dependencies on other tests
- **Repeatable**: Pass consistently every time

## When to Write Unit Tests

Write unit tests for:

- React components (rendering, props, events)
- Custom React hooks
- Pure utility functions
- Business logic functions
- Error handling cases
- Edge cases and boundary conditions

## Test Structure

### File Organization

```
unit/
├── components/               # Component tests
│   ├── ActivityCard.test.tsx
│   ├── ActivityList.test.tsx
│   ├── CommentLikes.test.tsx
│   ├── ImageGallery.test.tsx
│   ├── PostStats.test.tsx
│   ├── ProtectedRoute.test.tsx
│   ├── SessionCard-images.test.tsx
│   ├── accessibility/       # Accessibility tests
│   ├── auth/                # Auth component tests
│   ├── analytics/           # Analytics component tests
│   └── session/             # Session component tests
└── hooks/                   # Hook tests
    └── useTimerQuery.test.ts
```

### Naming Convention

- File name: `ComponentName.test.tsx` or `hookName.test.ts`
- Test suite: `describe('ComponentName', () => {})`
- Test case: `it('should [expected behavior]', () => {})`

## Testing Components

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { ActivityCard } from '@/components/ActivityCard';

describe('ActivityCard', () => {
  it('should render activity card with data', () => {
    const activity = {
      id: '1',
      title: 'Morning Workout',
      duration: 60,
    };

    render(<ActivityCard activity={activity} />);

    expect(screen.getByText('Morning Workout')).toBeInTheDocument();
    expect(screen.getByText(/60 minutes/)).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('should submit form with email and password', async () => {
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Use userEvent for realistic user interactions
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });
});
```

### Testing Props

```typescript
describe('Button', () => {
  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });

  it('should handle disabled state', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing Conditional Rendering

```typescript
describe('UserProfile', () => {
  it('should show loading state', () => {
    render(<UserProfile loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<UserProfile error="User not found" />);
    expect(screen.getByText('User not found')).toBeInTheDocument();
  });

  it('should show user data when loaded', () => {
    const user = { id: '1', name: 'John Doe' };
    render(<UserProfile user={user} loading={false} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Testing Hooks

### renderHook Usage

Use `renderHook` to test custom hooks in isolation:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('should initialize with zero', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(-1);
  });
});
```

### Testing Hooks with Dependencies

```typescript
import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';

describe('useTitle', () => {
  it('should set document title', () => {
    renderHook(() => useTitle('My Page'));
    expect(document.title).toBe('My Page');
  });

  it('should update title when prop changes', () => {
    const { rerender } = renderHook(({ title }) => useTitle(title), {
      initialProps: { title: 'First' },
    });

    expect(document.title).toBe('First');

    rerender({ title: 'Second' });
    expect(document.title).toBe('Second');
  });
});
```

### Testing Async Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAsync } from '@/hooks/useAsync';

describe('useAsync', () => {
  it('should handle async operation', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'success' });

    const { result } = renderHook(() => useAsync(mockFetch));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ data: 'success' });
  });

  it('should handle async errors', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useAsync(mockFetch));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('Failed'));
  });
});
```

## Testing with Mocks

### Mocking Modules

```typescript
import { LoginForm } from '@/components/auth/LoginForm';
import * as authService from '@/services/authService';

// Mock at module level (outside describe)
jest.mock('@/services/authService');

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call login service', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ uid: 'user-1' });
    (authService.login as jest.Mock) = mockLogin;

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });
});
```

### Mocking Context Providers

```typescript
import { render, screen } from '@testing-library/react';
import { AuthContext } from '@/contexts/AuthContext';
import { Dashboard } from '@/components/Dashboard';

describe('Dashboard with AuthContext', () => {
  it('should display user info from context', () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const mockValue = {
      user: mockUser,
      loading: false,
      error: null,
    };

    render(
      <AuthContext.Provider value={mockValue}>
        <Dashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
  });
});
```

### Using jest.spyOn for Partial Mocking

```typescript
import { useEffect } from 'react';
import { render } from '@testing-library/react';
import * as apiUtils from '@/lib/api';

describe('Component with API calls', () => {
  it('should call API on mount', () => {
    const spy = jest.spyOn(apiUtils, 'fetchData').mockResolvedValue({
      data: [],
    });

    render(<MyComponent />);

    expect(spy).toHaveBeenCalled();

    spy.mockRestore(); // Clean up
  });
});
```

## Testing Accessibility

### ARIA and Labels

```typescript
describe('FormInput - Accessibility', () => {
  it('should have proper label', () => {
    render(<FormInput name="email" label="Email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
  });

  it('should support keyboard input', async () => {
    render(<FormInput name="search" />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'search term');

    expect(input).toHaveValue('search term');
  });
});
```

### Testing Icon Buttons

```typescript
describe('IconButton - Accessibility', () => {
  it('should have accessible name', () => {
    render(<IconButton icon="heart" aria-label="Like post" />);

    expect(screen.getByRole('button', { name: 'Like post' })).toBeInTheDocument();
  });

  it('should be keyboard accessible', async () => {
    render(<IconButton icon="close" aria-label="Close dialog" />);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(button).toHaveBeenActivated();
  });
});
```

### Testing Keyboard Navigation

```typescript
describe('Dropdown - Keyboard Navigation', () => {
  it('should open on Enter key', async () => {
    render(<Dropdown>Menu</Dropdown>);

    const trigger = screen.getByRole('button');
    trigger.focus();

    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('menu')).toBeVisible();
  });

  it('should navigate with arrow keys', async () => {
    render(<Dropdown><MenuItem>Option 1</MenuItem><MenuItem>Option 2</MenuItem></Dropdown>);

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const menu = screen.getByRole('menu');
    const items = screen.getAllByRole('menuitem');

    // Arrow down
    await userEvent.keyboard('{ArrowDown}');
    expect(items[0]).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
  });
});
```

## Testing Focus States

```typescript
describe('Button Focus States', () => {
  it('should show focus outline', async () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).toHaveFocus();
    expect(button).toHaveStyle('outline: 2px solid #007AFF');
  });

  it('should show focus on keyboard navigation', async () => {
    render(
      <>
        <Button>First</Button>
        <Button>Second</Button>
      </>
    );

    const buttons = screen.getAllByRole('button');

    await userEvent.tab();
    expect(buttons[0]).toHaveFocus();

    await userEvent.tab();
    expect(buttons[1]).toHaveFocus();
  });
});
```

## Testing Analytics

```typescript
describe('Analytics Tracking', () => {
  it('should track page view on mount', () => {
    const trackSpy = jest.spyOn(analytics, 'track');

    render(<HomePage />);

    expect(trackSpy).toHaveBeenCalledWith('page_view', {
      page: '/',
    });
  });

  it('should track user interactions', async () => {
    const trackSpy = jest.spyOn(analytics, 'track');

    render(<Button onClick={() => {}}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));

    expect(trackSpy).toHaveBeenCalledWith('button_click', {
      text: 'Click',
    });
  });
});
```

## Common Patterns

### Testing Form Components

```typescript
describe('SignupForm', () => {
  it('should validate required fields', async () => {
    render(<SignupForm />);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<SignupForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });
});
```

### Testing List Components

```typescript
describe('ActivityList', () => {
  it('should render list of activities', () => {
    const activities = [
      { id: '1', title: 'Activity 1' },
      { id: '2', title: 'Activity 2' },
      { id: '3', title: 'Activity 3' },
    ];

    render(<ActivityList activities={activities} />);

    activities.forEach((activity) => {
      expect(screen.getByText(activity.title)).toBeInTheDocument();
    });
  });

  it('should show empty state', () => {
    render(<ActivityList activities={[]} />);
    expect(screen.getByText(/no activities found/i)).toBeInTheDocument();
  });

  it('should call onClick when item is clicked', async () => {
    const handleClick = jest.fn();
    const activities = [{ id: '1', title: 'Activity 1' }];

    render(<ActivityList activities={activities} onActivityClick={handleClick} />);

    await userEvent.click(screen.getByText('Activity 1'));

    expect(handleClick).toHaveBeenCalledWith(activities[0]);
  });
});
```

### Testing Modal Components

```typescript
describe('Modal', () => {
  it('should render modal content', () => {
    render(
      <Modal isOpen={true}>
        <h2>Modal Title</h2>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('should close on backdrop click', async () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>
    );

    const backdrop = screen.getByRole('presentation');
    await userEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalled();
  });

  it('should close on Escape key', async () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>
    );

    await userEvent.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalled();
  });
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Bad - testing internal state
it('should set state to true', () => {
  const { result } = renderHook(() => useToggle());
  act(() => result.current.toggle());
  expect(result.current.isOpen).toBe(true);
});

// Good - testing behavior
it('should show menu when opened', async () => {
  render(<Dropdown />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('menu')).toBeVisible();
});
```

### 2. Use Semantic Queries

```typescript
// Bad - brittle, depends on CSS classes
screen.getByClassName('btn-primary');

// Good - accessible and semantic
screen.getByRole('button', { name: /submit/i });
```

### 3. Avoid Testing Implementation Details

```typescript
// Bad - testing component internals
expect(component.state.isLoading).toBe(false);

// Good - testing what user sees
expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
```

### 4. Keep Tests DRY

```typescript
// Bad - setup repeated
describe('Button', () => {
  it('test 1', () => {
    render(<Button>Click</Button>);
    // setup repeated
  });
  it('test 2', () => {
    render(<Button>Click</Button>);
    // setup repeated
  });
});

// Good - shared setup
describe('Button', () => {
  beforeEach(() => {
    render(<Button>Click</Button>);
  });
  it('test 1', () => {
    // use rendered button
  });
  it('test 2', () => {
    // use rendered button
  });
});
```

### 5. Test Edge Cases

```typescript
describe('Avatar', () => {
  it('should handle missing image gracefully', () => {
    render(<Avatar image={null} fallback="JD" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should handle very long names', () => {
    const longName = 'A'.repeat(100);
    render(<Avatar name={longName} />);
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('should handle emoji in names', () => {
    render(<Avatar name="John 😊 Doe" />);
    expect(screen.getByText('John 😊 Doe')).toBeInTheDocument();
  });
});
```

## Coverage Goals

Unit tests should achieve:

- **95%+ Line Coverage** - All code executed at least once
- **95%+ Branch Coverage** - All conditional paths tested
- **95%+ Function Coverage** - All functions called
- **95%+ Statement Coverage** - All statements executed

Check coverage with:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Next Steps

- [Main Test Guide](../README.md) - Back to overview
- [Integration Tests Guide](../integration/README.md) - Multi-component testing
- [Mocks Guide](../__mocks__/README.md) - Using shared mocks
