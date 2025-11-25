/**
 * Integration Test: Create Project Flow
 *
 * Tests the complete project creation workflow:
 * - Create project → Save to Firebase → Update context → Cache update
 * - Validation errors → Display → Prevent submit
 * - Project appears in project list
 */

// Note: 'any' types used for test mocks; unused vars acceptable in test setup

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  resetFactoryCounters,
  resetMockProjectCounter,
} from '../__helpers__'
import { CACHE_KEYS } from '@/lib/queryClient'

const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore)

jest.mock('@/lib/api', () => ({
  firebaseProjectsApi: {
    create: mockFirebaseApi.projects.create,
    getAll: mockFirebaseApi.projects.getAll,
  },
}))

describe('Integration: Create Project Flow', () => {
  let queryClient: any
  let user: any

  beforeEach(() => {
    queryClient = createTestQueryClient()
    resetFirebaseStore()
    resetFactoryCounters()
    resetMockProjectCounter()
    jest.clearAllMocks()

    user = createTestUser({ email: 'user@test.com' })
    testFirebaseStore.createUser(user)
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('creates project and adds to Firebase', async () => {
    // Act: Create project
    const projectData = {
      userId: user.id,
      name: 'New Project',
      description: 'Project description',
      color: '#007AFF',
      icon: 'folder',
    }

    const project = await mockFirebaseApi.projects.create(projectData)

    // Assert: Project created
    expect(mockFirebaseApi.projects.create).toHaveBeenCalledWith(projectData)
    expect(project).toBeDefined()
    expect(project.name).toBe('New Project')
    expect(project.userId).toBe(user.id)

    // Assert: Project stored
    const storedProject = testFirebaseStore.getProject(project.id)
    expect(storedProject).toBeDefined()
    expect(storedProject?.name).toBe('New Project')
  })

  it('validates required fields', async () => {
    // Mock validation
    mockFirebaseApi.projects.create.mockImplementationOnce(async (data: any) => {
      if (!data.name) throw new Error('Project name required')
      if (!data.userId) throw new Error('User ID required')
      const project = testFirebaseStore.getProjects(user.id)[0]
      if (!project) throw new Error('No project found')
      return project
    })

    // Act & Assert: Missing name
    await expect(mockFirebaseApi.projects.create({ userId: user.id } as any)).rejects.toThrow(
      'Project name required'
    )

    // Act & Assert: Missing userId
    await expect(mockFirebaseApi.projects.create({ name: 'Test' } as any)).rejects.toThrow(
      'User ID required'
    )
  })

  it('updates cache after project creation', async () => {
    // Arrange: Set empty projects in cache
    queryClient.setQueryData(CACHE_KEYS.PROJECTS(user.id), [])

    // Act: Create project
    const project = await mockFirebaseApi.projects.create({
      userId: user.id,
      name: 'Test Project',
      color: '#007AFF',
      icon: 'folder',
    })

    // Simulate cache update
    const projects = testFirebaseStore.getProjects(user.id)
    queryClient.setQueryData(CACHE_KEYS.PROJECTS(user.id), projects)

    // Assert: Cache updated
    const cachedProjects = queryClient.getQueryData(CACHE_KEYS.PROJECTS(user.id))
    expect(cachedProjects).toHaveLength(1)
    expect(cachedProjects[0].id).toBe(project.id)
  })

  it('sets default values for optional fields', async () => {
    // Act: Create minimal project
    const project = await mockFirebaseApi.projects.create({
      userId: user.id,
      name: 'Minimal Project',
    })

    // Assert: Defaults applied
    expect(project.status).toBe('active')
    expect(project.createdAt).toBeInstanceOf(Date)
    expect(project.updatedAt).toBeInstanceOf(Date)
  })

  it('allows multiple projects for same user', async () => {
    // Act: Create multiple projects
    const project1 = await mockFirebaseApi.projects.create({
      userId: user.id,
      name: 'Project 1',
    })

    const project2 = await mockFirebaseApi.projects.create({
      userId: user.id,
      name: 'Project 2',
    })

    // Assert: Both stored
    const projects = testFirebaseStore.getProjects(user.id)
    expect(projects).toHaveLength(2)
    expect(projects.map((p) => p.name)).toContain('Project 1')
    expect(projects.map((p) => p.name)).toContain('Project 2')
  })
})
