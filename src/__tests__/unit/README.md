# Unit Tests

Unit tests verify individual components and functions in isolation with all dependencies mocked.

## What to Test

### Component Rendering
- Props are rendered correctly
- Conditional rendering works as expected
- Default props and edge cases
- Component lifecycle behavior

### User Interactions
- Click handlers execute correctly
- Form submissions work as expected
- Keyboard interactions
- Focus management

### State Management
- Component state updates correctly
- Props changes trigger re-renders
- Side effects are handled properly

### Accessibility
- ARIA attributes are present
- Keyboard navigation works
- Focus indicators are visible
- Screen reader compatibility
- Touch target sizes meet standards

## Testing Patterns

### Basic Component Test
```typescript
import { render, screen } from '@testing-library/react'
import { ComponentName } from '../ComponentName'

describe('ComponentName', () => {
  it('should render with required props', () => {
    render(<ComponentName title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Testing User Interactions
```typescript
import userEvent from '@testing-library/user-event'

it('should call onClick handler when clicked', async () => {
  const user = userEvent.setup()
  const handleClick = jest.fn()

  render(<Button onClick={handleClick}>Click me</Button>)

  await user.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

### Testing Forms
```typescript
it('should validate email input', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)

  const emailInput = screen.getByLabelText(/email/i)
  await user.type(emailInput, 'invalid-email')

  const submitButton = screen.getByRole('button', { name: /submit/i })
  await user.click(submitButton)

  expect(screen.getByText('Email is invalid')).toBeInTheDocument()
})
```

### Testing Accessibility
```typescript
it('should have proper ARIA attributes', () => {
  render(<ProgressBar value={50} max={100} />)

  const progressBar = screen.getByRole('progressbar')
  expect(progressBar).toHaveAttribute('aria-valuenow', '50')
  expect(progressBar).toHaveAttribute('aria-valuemin', '0')
  expect(progressBar).toHaveAttribute('aria-valuemax', '100')
})

it('should support keyboard navigation', async () => {
  const user = userEvent.setup()
  render(<Dropdown options={['A', 'B', 'C']} />)

  const trigger = screen.getByRole('button')
  await user.keyboard('{Enter}')

  const menu = screen.getByRole('menu')
  expect(menu).toBeInTheDocument()

  await user.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(screen.getAllByRole('menuitem')[0])
})
```

## Mocking Strategies

### Mock Contexts
```typescript
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn()
  })
}))
```

### Mock Firebase
```typescript
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}))
```

### Mock Next.js
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>
}))
```

## Test Organization

### components/
General component unit tests

### components/accessibility/
Accessibility-specific tests focusing on:
- Focus management
- Keyboard navigation
- ARIA attributes
- Touch target sizing

### components/auth/
Authentication form components:
- LoginForm
- SignupForm
- Password reset flows

### components/session/
Session timer components and related UI

### components/analytics/
Analytics dashboard components with accessibility tests

## Common Pitfalls

### ❌ Don't test implementation details
```typescript
// Bad - testing internal state
expect(component.state.count).toBe(5)

// Good - testing user-visible behavior
expect(screen.getByText('5')).toBeInTheDocument()
```

### ❌ Don't use getByTestId by default
```typescript
// Bad - relies on test IDs
screen.getByTestId('submit-button')

// Good - uses semantic queries
screen.getByRole('button', { name: /submit/i })
```

### ❌ Don't forget to wait for async updates
```typescript
// Bad - doesn't wait for state update
fireEvent.click(button)
expect(screen.getByText('Success')).toBeInTheDocument()

// Good - waits for async update
await user.click(button)
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

## Running Unit Tests Only

```bash
# Run all unit tests
npm test -- unit/

# Run specific component tests
npm test -- ActivityCard

# Run accessibility tests
npm test -- unit/components/accessibility/

# Watch mode for unit tests
npm test -- --watch unit/
```
