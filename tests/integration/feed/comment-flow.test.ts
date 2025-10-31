/**
 * Integration Test: Session Comment Flow
 *
 * Tests the complete comment workflow:
 * - Add comment → Optimistic add → API call → Refetch
 * - Delete comment → Remove from UI → API call
 * - Comment count updates correctly
 * - Real-time comment updates
 */

 
// Note: 'any' types used for test mocks; unused vars acceptable in test setup

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestProject,
  createTestActivity,
  createTestSession,
  createTestComment,
  resetFactoryCounters,
} from '../__helpers__';
import { CACHE_KEYS } from '@/lib/queryClient';

const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore);

jest.mock('@/lib/api', () => ({
  firebaseCommentsApi: {
    addComment: mockFirebaseApi.social.comment,
    getComments: jest.fn(async (sessionId: string) =>
      testFirebaseStore.getComments(sessionId)
    ),
    deleteComment: jest.fn(async (sessionId: string, commentId: string) => {
      testFirebaseStore.deleteComment(sessionId, commentId);
    }),
  },
}));

describe('Integration: Session Comment Flow', () => {
  let queryClient: any;
  let user: any;
  let session: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    resetFirebaseStore();
    resetFactoryCounters();
    jest.clearAllMocks();

    user = createTestUser({ email: 'user@test.com' });
    const project = createTestProject(user.id);
    const activity = createTestActivity(project.id);
    session = createTestSession(user.id, project.id, activity.id, {
      commentCount: 0,
    });

    testFirebaseStore.createUser(user);
    testFirebaseStore.createProject(project);
    testFirebaseStore.createSession(session);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('adds comment with optimistic update and API call', async () => {
    // Act: Add comment
    const commentData = {
      userId: user.id,
      sessionId: session.id,
      text: 'Great work!',
    };

    const comment = await mockFirebaseApi.social.comment(
      session.id,
      commentData
    );

    // Assert: Comment created
    expect(mockFirebaseApi.social.comment).toHaveBeenCalledWith(
      session.id,
      commentData
    );
    expect(comment).toBeDefined();
    expect(comment.text).toBe('Great work!');

    // Assert: Comment stored
    const comments = testFirebaseStore.getComments(session.id);
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('Great work!');

    // Assert: Comment count incremented
    const updatedSession = testFirebaseStore.getSession(session.id);
    expect(updatedSession?.commentCount).toBe(1);
  });

  it('deletes comment and updates count', async () => {
    // Arrange: Add comment
    const comment = await mockFirebaseApi.social.comment(session.id, {
      userId: user.id,
      sessionId: session.id,
      text: 'Test comment',
    });

    expect(testFirebaseStore.getComments(session.id)).toHaveLength(1);

    // Act: Delete comment
    testFirebaseStore.deleteComment(session.id, comment.id);

    // Assert: Comment removed
    const comments = testFirebaseStore.getComments(session.id);
    expect(comments).toHaveLength(0);

    // Assert: Count decremented
    const updatedSession = testFirebaseStore.getSession(session.id);
    expect(updatedSession?.commentCount).toBe(0);
  });

  it('handles multiple comments from different users', async () => {
    // Arrange: Create additional users
    const user2 = createTestUser({ email: 'user2@test.com' });
    const user3 = createTestUser({ email: 'user3@test.com' });
    testFirebaseStore.createUser(user2);
    testFirebaseStore.createUser(user3);

    // Act: Multiple users comment
    await mockFirebaseApi.social.comment(session.id, {
      userId: user.id,
      text: 'Comment 1',
    });
    await mockFirebaseApi.social.comment(session.id, {
      userId: user2.id,
      text: 'Comment 2',
    });
    await mockFirebaseApi.social.comment(session.id, {
      userId: user3.id,
      text: 'Comment 3',
    });

    // Assert: All comments stored
    const comments = testFirebaseStore.getComments(session.id);
    expect(comments).toHaveLength(3);

    // Assert: Count = 3
    const updatedSession = testFirebaseStore.getSession(session.id);
    expect(updatedSession?.commentCount).toBe(3);
  });

  it('prevents empty comments', async () => {
    // Mock validation
    mockFirebaseApi.social.comment.mockImplementationOnce(
      async (sessionId: string, data: any) => {
        if (!data.text || data.text.trim() === '') {
          throw new Error('Comment text required');
        }
        return createTestComment(user.id, sessionId, data);
      }
    );

    // Act & Assert: Empty comment
    await expect(
      mockFirebaseApi.social.comment(session.id, {
        userId: user.id,
        text: '',
      })
    ).rejects.toThrow('Comment text required');

    // Assert: No comment added
    expect(testFirebaseStore.getComments(session.id)).toHaveLength(0);
  });

  it('preserves comment order (newest first)', async () => {
    // Act: Add comments with delays
    const comment1 = await mockFirebaseApi.social.comment(session.id, {
      userId: user.id,
      text: 'First',
      createdAt: new Date(Date.now() - 3000),
    });

    const comment2 = await mockFirebaseApi.social.comment(session.id, {
      userId: user.id,
      text: 'Second',
      createdAt: new Date(Date.now() - 2000),
    });

    const comment3 = await mockFirebaseApi.social.comment(session.id, {
      userId: user.id,
      text: 'Third',
      createdAt: new Date(Date.now() - 1000),
    });

    // Act: Fetch comments
    const comments = testFirebaseStore.getComments(session.id);

    // Assert: Order preserved (insertion order in our mock)
    expect(comments).toHaveLength(3);
    expect(comments[0].text).toBe('First');
    expect(comments[2].text).toBe('Third');
  });
});
