# Integration Tests Guide

Comprehensive guide for writing integration tests that verify multi-component workflows and feature interactions.

## Overview

Integration tests verify that multiple components, services, and systems work together correctly. Unlike unit tests that test components in isolation, integration tests exercise real workflows and interactions.

### When to Write Integration Tests

Write integration tests for:

- Complete user workflows (e.g., login -> create session -> upload image)
- Firebase integration with components and services
- React Query with API/database calls
- File upload and processing workflows
- Authentication and authorization flows
- Data synchronization between components
- Real-time features (subscriptions, listeners)

## Test Structure

```
integration/
├── README.md                      # This file
├── auth/                          # Authentication flows
│   └── google-signin.test.ts
├── firebase/                      # Firebase integration
│   ├── feed-images.test.tsx
│   ├── image-storage.test.ts
│   └── session-images-firestore.test.ts
└── image-upload/                  # File upload workflows
    ├── upload-flow-simple.test.ts
    └── upload-flow.test.tsx
```

## Setting Up Integration Tests

### Test Environment Setup

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockUser, createMockSession } from '@/__tests__/__mocks__/mocks';
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // Disable retries in tests
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('Integration: User Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete user workflow', async () => {
    render(<App />, { wrapper: TestWrapper });
    // Test implementation
  });
});
```

## Authentication Flows

### Google Sign-In Integration

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import * as authService from '@/services/authService';

jest.mock('@/services/authService');

describe('Integration: Google Sign-In Flow', () => {
  it('should sign in user with Google', async () => {
    const mockUser = {
      uid: 'user-123',
      email: 'user@gmail.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
    };

    const mockSignIn = jest.fn().mockResolvedValue(mockUser);
    (authService.signInWithGoogle as jest.Mock) = mockSignIn;

    render(<GoogleSignIn />);

    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    await userEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });

    // Verify user is logged in
    await waitFor(() => {
      expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
    });
  });

  it('should handle sign-in errors', async () => {
    const mockError = new Error('Google sign-in failed');
    (authService.signInWithGoogle as jest.Mock).mockRejectedValue(mockError);

    render(<GoogleSignIn />);

    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    await userEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to sign in/i)).toBeInTheDocument();
    });
  });

  it('should create user profile after sign-in', async () => {
    const mockUser = {
      uid: 'user-123',
      email: 'newuser@gmail.com',
      displayName: 'New User',
    };

    (authService.signInWithGoogle as jest.Mock).mockResolvedValue(mockUser);

    const mockCreateProfile = jest.fn().mockResolvedValue({ success: true });
    (authService.createUserProfile as jest.Mock) = mockCreateProfile;

    render(<GoogleSignIn />);

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockCreateProfile).toHaveBeenCalledWith(mockUser);
    });
  });
});
```

## Firebase Integration

### Reading Data from Firestore

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { FeedPage } from '@/components/FeedPage';
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';
import { createMockSession } from '@/__tests__/__mocks__/mocks';

jest.mock('firebase/firestore');

describe('Integration: Feed - Reading Sessions from Firestore', () => {
  it('should load and display sessions from Firestore', async () => {
    const mockSessions = [
      createMockSession({ id: 'session-1', title: 'Morning Coding' }),
      createMockSession({ id: 'session-2', title: 'Afternoon Design' }),
    ];

    // Mock Firestore response
    firebaseMock.db
      .collection('sessions')
      .where.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          onSnapshot: jest.fn().mockImplementation((callback) => {
            callback({
              docs: mockSessions.map((session) => ({
                id: session.id,
                data: () => session,
              })),
            });
            return jest.fn(); // Unsubscribe function
          }),
        }),
      });

    render(<FeedPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Coding')).toBeInTheDocument();
      expect(screen.getByText('Afternoon Design')).toBeInTheDocument();
    });
  });

  it('should handle empty feed', async () => {
    firebaseMock.db
      .collection('sessions')
      .where.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          onSnapshot: jest.fn().mockImplementation((callback) => {
            callback({ docs: [] });
            return jest.fn();
          }),
        }),
      });

    render(<FeedPage />);

    await waitFor(() => {
      expect(screen.getByText(/no sessions found/i)).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    firebaseMock.db
      .collection('sessions')
      .where.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          onSnapshot: jest.fn(),
        }),
      });

    render(<FeedPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Eventually should load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
```

### Writing Data to Firestore

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionCreationForm } from '@/components/SessionCreationForm';
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';

jest.mock('firebase/firestore');

describe('Integration: Session Creation - Writing to Firestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseMock.db.collection('sessions').add.mockResolvedValue({
      id: 'new-session-id',
    });
  });

  it('should create session in Firestore', async () => {
    render(<SessionCreationForm />);

    await userEvent.type(screen.getByLabelText(/title/i), 'My Session');
    await userEvent.type(screen.getByLabelText(/description/i), 'Working on features');
    await userEvent.type(screen.getByLabelText(/duration/i), '120');

    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(firebaseMock.db.collection).toHaveBeenCalledWith('sessions');
      expect(firebaseMock.db.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Session',
          description: 'Working on features',
          duration: 120,
        })
      );
    });

    expect(screen.getByText(/session created successfully/i)).toBeInTheDocument();
  });

  it('should handle Firestore write errors', async () => {
    firebaseMock.db
      .collection('sessions')
      .add.mockRejectedValue(new Error('Write failed'));

    render(<SessionCreationForm />);

    await userEvent.type(screen.getByLabelText(/title/i), 'My Session');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create session/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during creation', async () => {
    let resolveAdd: Function;
    firebaseMock.db.collection('sessions').add.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAdd = resolve;
        })
    );

    render(<SessionCreationForm />);

    await userEvent.type(screen.getByLabelText(/title/i), 'My Session');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    // While loading
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/creating/i)).toBeInTheDocument();

    // After completion
    resolveAdd!({ id: 'new-id' });

    await waitFor(() => {
      expect(screen.getByText(/session created/i)).toBeInTheDocument();
    });
  });
});
```

## React Query Integration

### Testing Data Fetching

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from '@/components/UserList';
import * as userService from '@/services/userService';

jest.mock('@/services/userService');

describe('Integration: User List - React Query Data Fetching', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('should fetch and display users', async () => {
    const mockUsers = [
      { id: '1', name: 'User 1' },
      { id: '2', name: 'User 2' },
    ];

    (userService.getUsers as jest.Mock).mockResolvedValue(mockUsers);

    render(
      <QueryClientProvider client={queryClient}>
        <UserList />
      </QueryClientProvider>
    );

    // Loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Data loaded
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
    });
  });

  it('should handle query errors', async () => {
    (userService.getUsers as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <UserList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
    });
  });

  it('should refetch on demand', async () => {
    const mockUsers = [{ id: '1', name: 'User 1' }];
    (userService.getUsers as jest.Mock).mockResolvedValue(mockUsers);

    render(
      <QueryClientProvider client={queryClient}>
        <UserList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    const refetchButton = screen.getByRole('button', { name: /refresh/i });
    await userEvent.click(refetchButton);

    expect(userService.getUsers).toHaveBeenCalledTimes(2);
  });
});
```

### Testing Mutations

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateProjectForm } from '@/components/CreateProjectForm';
import * as projectService from '@/services/projectService';

jest.mock('@/services/projectService');

describe('Integration: Create Project - React Query Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
  });

  it('should create project and update cache', async () => {
    const newProject = { id: 'proj-1', name: 'New Project', emoji: '🚀' };

    (projectService.createProject as jest.Mock).mockResolvedValue(newProject);

    render(
      <QueryClientProvider client={queryClient}>
        <CreateProjectForm />
      </QueryClientProvider>
    );

    await userEvent.type(screen.getByLabelText(/project name/i), 'New Project');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(projectService.createProject).toHaveBeenCalledWith({
        name: 'New Project',
      });
    });

    expect(screen.getByText(/project created/i)).toBeInTheDocument();
  });

  it('should handle mutation errors', async () => {
    (projectService.createProject as jest.Mock).mockRejectedValue(
      new Error('Name already exists')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <CreateProjectForm />
      </QueryClientProvider>
    );

    await userEvent.type(screen.getByLabelText(/project name/i), 'Duplicate');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/name already exists/i)).toBeInTheDocument();
    });
  });
});
```

## Image Upload and Storage

### File Upload Workflow

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadForm } from '@/components/ImageUploadForm';
import * as storageService from '@/services/storageService';

jest.mock('@/services/storageService');

describe('Integration: Image Upload Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload image and display it', async () => {
    const imageUrl = 'https://example.com/uploaded-image.jpg';

    (storageService.uploadImage as jest.Mock).mockResolvedValue({
      url: imageUrl,
      id: 'image-1',
    });

    render(<ImageUploadForm onSuccess={jest.fn()} />);

    const file = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload image/i) as HTMLInputElement;

    await userEvent.upload(input, file);

    // Show loading state
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    // Image uploaded
    await waitFor(() => {
      const image = screen.getByAltText(/uploaded/i) as HTMLImageElement;
      expect(image.src).toBe(imageUrl);
    });
  });

  it('should validate file type', async () => {
    render(<ImageUploadForm />);

    const file = new File(['text'], 'document.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload image/i) as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(screen.getByText(/only image files allowed/i)).toBeInTheDocument();
    expect(storageService.uploadImage).not.toHaveBeenCalled();
  });

  it('should validate file size', async () => {
    render(<ImageUploadForm maxSize={1000000} />); // 1MB max

    // Create a 2MB file
    const largeFile = new File(
      [new ArrayBuffer(2000000)],
      'large.jpg',
      { type: 'image/jpeg' }
    );
    const input = screen.getByLabelText(/upload image/i) as HTMLInputElement;

    await userEvent.upload(input, largeFile);

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    expect(storageService.uploadImage).not.toHaveBeenCalled();
  });

  it('should handle upload errors', async () => {
    (storageService.uploadImage as jest.Mock).mockRejectedValue(
      new Error('Upload failed')
    );

    render(<ImageUploadForm />);

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload image/i) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/failed to upload image/i)).toBeInTheDocument();
    });
  });
});
```

### Image Processing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionImageUpload } from '@/components/SessionImageUpload';
import * as imageService from '@/services/imageService';

jest.mock('@/services/imageService');

describe('Integration: Session Image Upload and Processing', () => {
  it('should upload, compress, and store image', async () => {
    const originalFile = new File(['original'], 'original.jpg', {
      type: 'image/jpeg',
    });

    const processedUrl = 'https://example.com/compressed.jpg';

    (imageService.processAndUpload as jest.Mock).mockResolvedValue({
      url: processedUrl,
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });

    render(<SessionImageUpload sessionId="session-1" />);

    const input = screen.getByLabelText(/add image/i) as HTMLInputElement;
    await userEvent.upload(input, originalFile);

    await waitFor(() => {
      const image = screen.getByAltText(/session image/i) as HTMLImageElement;
      expect(image.src).toBe(processedUrl);
    });

    expect(imageService.processAndUpload).toHaveBeenCalledWith(
      originalFile,
      expect.objectContaining({
        sessionId: 'session-1',
      })
    );
  });
});
```

## Complete User Workflows

### Session Creation Workflow

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionCreationWizard } from '@/components/SessionCreationWizard';
import * as sessionService from '@/services/sessionService';
import * as storageService from '@/services/storageService';

jest.mock('@/services/sessionService');
jest.mock('@/services/storageService');

describe('Integration: Complete Session Creation Workflow', () => {
  it('should create session with images', async () => {
    (sessionService.createSession as jest.Mock).mockResolvedValue({
      id: 'session-1',
    });

    (storageService.uploadImage as jest.Mock).mockResolvedValue({
      url: 'https://example.com/image.jpg',
    });

    render(<SessionCreationWizard />);

    // Step 1: Enter session details
    await userEvent.type(screen.getByLabelText(/project/i), 'My Project');
    await userEvent.type(screen.getByLabelText(/duration/i), '60');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Add images
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload image/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText(/uploaded/i)).toBeInTheDocument();
    });

    // Step 3: Review and submit
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Verify session was created
    await waitFor(() => {
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(storageService.uploadImage).toHaveBeenCalled();
      expect(screen.getByText(/session created successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Best Practices

### 1. Test Real User Workflows

Focus on what users actually do, not implementation details:

```typescript
// Good - tests actual workflow
it('should complete login flow', async () => {
  render(<LoginFlow />);
  await userEvent.type(emailInput, 'user@example.com');
  await userEvent.type(passwordInput, 'password');
  await userEvent.click(loginButton);
  // Verify logged in state
});

// Avoid - tests implementation
it('should call setUser in state', async () => {
  // testing React internals
});
```

### 2. Mock External Dependencies

```typescript
// Mock Firebase and API calls
jest.mock('firebase/firestore');
jest.mock('@/services/userService');

// But keep component logic real
// This tests how components work together
```

### 3. Test Error Scenarios

```typescript
// Always test failures
it('should show error message when upload fails', async () => {
  (uploadService.upload as jest.Mock).mockRejectedValue(
    new Error('Network error')
  );
  // Verify error handling
});
```

### 4. Use Realistic Test Data

```typescript
// Good - realistic data
const mockUser = createMockUser({
  name: 'John Doe',
  email: 'john@example.com',
});

// Avoid - incomplete test data
const mockUser = { id: '1' };
```

## Debugging Integration Tests

### Enable Debug Output

```typescript
it('should work correctly', () => {
  const { debug } = render(<Component />);

  // Print entire DOM
  debug();

  // Print specific element
  debug(screen.getByRole('button'));
});
```

### Check Mock Calls

```typescript
it('should call service', async () => {
  (myService.fetch as jest.Mock).mockResolvedValue({ data: [] });

  render(<Component />);

  // Check how many times called
  console.log(myService.fetch.mock.calls.length);

  // Check what arguments were passed
  console.log(myService.fetch.mock.calls[0]);
});
```

## Next Steps

- [Main Test Guide](../README.md) - Back to overview
- [Unit Tests Guide](../unit/README.md) - Individual component testing
- [Contract Tests Guide](../contract/README.md) - API contract validation
- [Mocks Guide](../__mocks__/README.md) - Using shared mocks
