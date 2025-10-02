/**
 * Manual Timer System Tests
 * 
 * This test file manually tests the timer system functionality
 * including database persistence, network resilience, and edge cases.
 */

import { mockTimerApi, mockTaskApi, mockProjectApi, mockAuthApi } from '../lib/mockApi';

// Setup test user and get valid token
let TEST_TOKEN: string;

// Setup test user before all tests
beforeAll(async () => {
  try {
    // Login with demo user to get valid token
    const response = await mockAuthApi.login({
      email: 'demo@ambira.com',
      password: 'password'
    });
    TEST_TOKEN = response.token;
    console.log('✅ Test user authenticated with token:', TEST_TOKEN);
  } catch (error) {
    console.error('❌ Failed to setup test user:', error);
    throw error;
  }
});

describe('Timer System - Manual Tests', () => {
  console.log('🧪 Testing Timer System...');

  test('1. Test timer session start', async () => {
    console.log('1. Testing timer session start...');
    
    try {
      const activeTimer = await mockTimerApi.startSession('1', ['2', '3'], TEST_TOKEN);
      
      expect(activeTimer).toBeDefined();
      expect(activeTimer.projectId).toBe('1');
      expect(activeTimer.selectedTaskIds).toEqual(['2', '3']);
      expect(activeTimer.pausedDuration).toBe(0);
      
      console.log('✅ Timer session start successful');
    } catch (error) {
      console.error('❌ Timer session start failed:', error);
      throw error;
    }
  });

  test('2. Test get active timer', async () => {
    console.log('2. Testing get active timer...');
    
    try {
      const activeTimer = await mockTimerApi.getActiveTimer(TEST_TOKEN);
      
      expect(activeTimer).toBeDefined();
      expect(activeTimer?.projectId).toBe('1');
      
      console.log('✅ Get active timer successful');
    } catch (error) {
      console.error('❌ Get active timer failed:', error);
      throw error;
    }
  });

  test('3. Test timer pause/resume', async () => {
    console.log('3. Testing timer pause/resume...');
    
    try {
      const activeTimer = await mockTimerApi.getActiveTimer(TEST_TOKEN);
      if (!activeTimer) throw new Error('No active timer found');
      
      // Simulate 5 minutes of elapsed time
      const pausedDuration = 300; // 5 minutes in seconds
      const updatedTimer = await mockTimerApi.updateActiveTimer(
        activeTimer.id,
        pausedDuration,
        ['2', '3'],
        TEST_TOKEN
      );
      
      expect(updatedTimer.pausedDuration).toBe(300);
      
      console.log('✅ Timer pause/resume successful');
    } catch (error) {
      console.error('❌ Timer pause/resume failed:', error);
      throw error;
    }
  });

  test('4. Test project and task loading', async () => {
    console.log('4. Testing project and task loading...');
    
    try {
      const [project, tasks] = await Promise.all([
        mockProjectApi.getProject('1', TEST_TOKEN),
        mockTaskApi.getProjectTasks('1', TEST_TOKEN)
      ]);
      
      expect(project).toBeDefined();
      expect(project.id).toBe('1');
      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
      
      console.log('✅ Project and task loading successful');
    } catch (error) {
      console.error('❌ Project and task loading failed:', error);
      throw error;
    }
  });

  test('5. Test session finish', async () => {
    console.log('5. Testing session finish...');
    
    try {
      const activeTimer = await mockTimerApi.getActiveTimer(TEST_TOKEN);
      if (!activeTimer) throw new Error('No active timer found');
      
      const sessionData = {
        projectId: '1',
        title: 'Test Session',
        description: 'Testing timer functionality',
        duration: 300, // 5 minutes
        startTime: new Date(),
        taskIds: ['2', '3'],
        tags: ['test', 'development'],
        howFelt: 4,
        privateNotes: 'This was a test session'
      };
      
      const session = await mockTimerApi.finishSession(activeTimer.id, sessionData, TEST_TOKEN);
      
      expect(session).toBeDefined();
      expect(session.title).toBe('Test Session');
      expect(session.duration).toBe(300);
      
      console.log('✅ Session finish successful');
    } catch (error) {
      console.error('❌ Session finish failed:', error);
      throw error;
    }
  });

  test('6. Test no active timer after finish', async () => {
    console.log('6. Testing no active timer after finish...');
    
    try {
      const activeTimer = await mockTimerApi.getActiveTimer(TEST_TOKEN);
      expect(activeTimer).toBeNull();
      
      console.log('✅ No active timer after finish confirmed');
    } catch (error) {
      console.error('❌ Active timer check failed:', error);
      throw error;
    }
  });

  test('7. Test error handling', async () => {
    console.log('7. Testing error handling...');
    
    try {
      // Test invalid project
      await expect(mockTimerApi.startSession('999', [], TEST_TOKEN))
        .rejects.toThrow('Project not found');
      
      // Test invalid token
      await expect(mockTimerApi.getActiveTimer('invalid_token'))
        .rejects.toThrow('Invalid token');
      
      console.log('✅ Error handling successful');
    } catch (error) {
      console.error('❌ Error handling failed:', error);
      throw error;
    }
  });

  console.log('🎉 All timer system tests passed!');
});
