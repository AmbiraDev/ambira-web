# Integration Tests

Integration tests verify how multiple components, services, or external systems work together to achieve complete user workflows.

## What to Test

### Multi-Component Workflows
- Complete user journeys (sign up → login → dashboard)
- Data flow between components
- Component communication
- State synchronization

### External Service Integration
- Firebase authentication flows
- Firestore CRUD operations
- Storage upload/download
- Real-time listeners
- API integrations

### Data Persistence
- Session storage
- Local storage
- IndexedDB
- Firebase persistence

## Test Categories

### auth/
Authentication integration tests:
- Google Sign-In (redirect and popup flows)
- Email/password authentication
- Session management
- Token refresh

### firebase/
Firebase service integration tests:
- Feed with images from Firestore
- Image storage integration
- Session data persistence
- Real-time updates

### image-upload/
Complete image upload workflows:
- File selection and validation
- Upload progress tracking
- Storage integration
- URL generation and persistence

## Testing Patterns

### Testing Authentication Flows
```typescript
import { firebaseAuthApi } from '@/lib/firebaseApi'
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'

describe('Google Sign-In Integration', () => {
  it('should complete popup flow on desktop', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    }

    (signInWithPopup as jest.Mock).mockResolvedValue({
      user: mockUser
    })

    const result = await firebaseAuthApi.signInWithGoogle()

    expect(signInWithPopup).toHaveBeenCalled()
    expect(result.user.email).toBe('test@example.com')
  })

  it('should use redirect flow on mobile', async () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
      writable: true
    })

    (signInWithRedirect as jest.Mock).mockResolvedValue(undefined)

    try {
      await firebaseAuthApi.signInWithGoogle()
    } catch (error) {
      expect(error.message).toBe('REDIRECT_IN_PROGRESS')
    }

    expect(signInWithRedirect).toHaveBeenCalled()
  })
})
```

### Testing Firebase Operations
```typescript
import { getDocs, query, where } from 'firebase/firestore'
import { firebaseSessionApi } from '@/lib/firebaseApi'

describe('Firebase Feed Images Integration', () => {
  it('should load sessions with images from Firestore', async () => {
    const mockSessions = [
      {
        id: 'session1',
        userId: 'user1',
        title: 'Work Session',
        images: [
          'https://firebasestorage.googleapis.com/image1.jpg',
          'https://firebasestorage.googleapis.com/image2.jpg'
        ],
        visibility: 'everyone'
      }
    ]

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockSessions.map(s => ({
        id: s.id,
        data: () => s,
        exists: () => true
      }))
    })

    const result = await firebaseSessionApi.getSessions(20)

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].images).toHaveLength(2)
    expect(result.sessions[0].images[0]).toContain('firebasestorage.googleapis.com')
  })
})
```

### Testing Upload Workflows
```typescript
import { uploadImage } from '@/lib/imageUpload'
import { ref, uploadBytesResumable } from 'firebase/storage'

describe('Image Upload Flow Integration', () => {
  it('should upload image and return URL', async () => {
    const mockFile = new File(['image data'], 'test.jpg', {
      type: 'image/jpeg'
    })

    const mockUploadTask = {
      on: jest.fn((event, onProgress, onError, onComplete) => {
        // Simulate successful upload
        setTimeout(() => onComplete(), 100)
      })
    }

    (uploadBytesResumable as jest.Mock).mockReturnValue(mockUploadTask)

    const url = await uploadImage(mockFile, 'user-123')

    expect(url).toContain('firebasestorage.googleapis.com')
    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('user-123')
    )
  })
})
```

## Mocking Strategies

### Partial Firebase Mocks
For integration tests, you may want to mock only certain Firebase operations while testing others:

```typescript
// Mock only authentication, test Firestore
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  getAuth: jest.fn(() => ({ currentUser: mockUser }))
}))

// Real Firestore operations (mocked with test data)
jest.mock('firebase/firestore', () => ({
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  // ... actual implementation with test data
}))
```

### Simulate Network Delays
```typescript
it('should show loading state during upload', async () => {
  const mockUploadTask = {
    on: jest.fn((event, onProgress, onError, onComplete) => {
      // Simulate slow upload with progress
      setTimeout(() => onProgress({ bytesTransferred: 50, totalBytes: 100 }), 100)
      setTimeout(() => onComplete(), 500)
    })
  }

  render(<ImageUpload />)
  // Test loading states and progress updates
})
```

## Common Scenarios

### 1. Authentication Flow
- User initiates sign-in
- Firebase authenticates
- User profile is created/loaded
- User is redirected to dashboard

### 2. Image Upload Flow
- User selects image
- Image is validated
- Upload to Firebase Storage begins
- Progress is tracked
- URL is generated
- URL is saved to Firestore
- UI updates with new image

### 3. Feed Loading Flow
- Component mounts
- Fetch sessions from Firestore
- Populate user/project data
- Load images from Storage URLs
- Render feed items
- Handle pagination

## Best Practices

### 1. Test Complete Workflows
```typescript
it('should complete full session creation with image', async () => {
  // 1. Start timer
  // 2. Upload image
  // 3. Complete session
  // 4. Verify Firestore document
  // 5. Verify Storage file
  // 6. Verify UI update
})
```

### 2. Mock External Services Realistically
```typescript
// Simulate realistic error conditions
(uploadBytesResumable as jest.Mock).mockImplementation(() => ({
  on: jest.fn((event, onProgress, onError) => {
    setTimeout(() => onError(new Error('Network error')), 100)
  })
}))
```

### 3. Clean Up After Tests
```typescript
afterEach(async () => {
  // Clear mock calls
  jest.clearAllMocks()

  // Clean up any created resources
  // (In production, use Firebase emulator for real cleanup)
})
```

### 4. Test Error Paths
```typescript
it('should handle upload failure gracefully', async () => {
  (uploadBytesResumable as jest.Mock).mockImplementation(() => {
    throw new Error('Upload failed')
  })

  await expect(uploadImage(file, userId)).rejects.toThrow('Upload failed')
})
```

## Running Integration Tests

```bash
# Run all integration tests
npm test -- integration/

# Run specific integration category
npm test -- integration/auth/
npm test -- integration/firebase/
npm test -- integration/image-upload/

# Run with verbose output
npm test -- --verbose integration/

# Watch mode
npm test -- --watch integration/
```

## Debugging Tips

### 1. Add Console Logging
```typescript
it('should upload image', async () => {
  console.log('Starting upload test...')
  const result = await uploadImage(file)
  console.log('Upload result:', result)
  expect(result).toBeDefined()
})
```

### 2. Increase Timeout for Slow Operations
```typescript
it('should complete long-running upload', async () => {
  // Increase timeout to 10 seconds
  jest.setTimeout(10000)

  const result = await uploadLargeFile(file)
  expect(result).toBeDefined()
}, 10000)
```

### 3. Test Individual Steps
```typescript
describe('Image Upload Flow', () => {
  it('step 1: validates file', () => { ... })
  it('step 2: uploads to storage', () => { ... })
  it('step 3: saves URL to Firestore', () => { ... })
  it('step 4: updates UI', () => { ... })
})
```

## Migration from Old Structure

Previously, integration tests were located in:
- `src/__tests__/integration/` - General integration tests
- `src/__tests__/auth/` - Auth-specific tests

They have been reorganized into:
- `integration/auth/` - Authentication flows
- `integration/firebase/` - Firebase service tests
- `integration/image-upload/` - Image upload workflows

All imports and paths remain the same relative to `src/`.
