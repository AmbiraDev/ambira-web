// Quick test to understand the query key structure
const CACHE_KEYS = {
  NOTIFICATIONS: (userId) => ['notifications', userId],
};

const mockUser = { id: 'user-123', username: 'testuser', name: 'Test User' };
const limit = 50;

// What the hook creates
const hookQueryKey = [...CACHE_KEYS.NOTIFICATIONS(mockUser.id || 'none'), limit, mockUser];
console.log('Hook query key:', JSON.stringify(hookQueryKey, null, 2));

// What the test is creating
const testQueryKey = ['notifications', 'user-123', 50, mockUser];
console.log('Test query key:', JSON.stringify(testQueryKey, null, 2));

// Are they equal?
console.log('Are they the same reference?', hookQueryKey === testQueryKey);
console.log('Are they deeply equal?', JSON.stringify(hookQueryKey) === JSON.stringify(testQueryKey));

// The actual issue - the user object in the key
console.log('User object reference issue:');
const user1 = { id: 'user-123', username: 'testuser', name: 'Test User' };
const user2 = { id: 'user-123', username: 'testuser', name: 'Test User' };
console.log('Different references, same content:', user1 !== user2);
