/**
 * Session Domain Entity Factory
 * Creates mock sessions for testing
 */

import { Session } from '@/domain/entities/Session'
import type { SessionVisibility, SessionUser, SessionActivity } from '@/domain/entities/Session'

interface CreateSessionOptions {
  id?: string
  userId?: string
  projectId?: string
  activityId?: string | null
  duration?: number
  createdAt?: Date
  title?: string
  description?: string
  visibility?: SessionVisibility
  supportCount?: number
  commentCount?: number
  groupIds?: string[]
  user?: SessionUser
  activity?: SessionActivity
  images?: string[]
  isSupported?: boolean
  allowComments?: boolean
}

let sessionIdCounter = 1
let sessionCounter = 0

export function createMockSession(options: CreateSessionOptions = {}): Session {
  const id = options.id || `session-${sessionIdCounter++}`
  const userId = options.userId || 'user-123'
  const projectId = options.projectId || 'project-456'
  const createdAt = options.createdAt || new Date('2024-01-15T10:00:00Z')

  return new Session(
    id,
    userId,
    projectId,
    options.activityId ?? 'activity-789',
    options.duration ?? 3600, // 1 hour
    createdAt,
    options.title ?? `Session ${sessionCounter++}`,
    options.description ?? 'Test session',
    options.visibility ?? 'everyone',
    options.supportCount ?? 0,
    options.commentCount ?? 0,
    options.groupIds ?? [],
    options.user,
    options.activity,
    undefined,
    options.images,
    options.isSupported ?? false,
    [],
    options.allowComments ?? true
  )
}

export function createMockSessionWithUser(
  options: CreateSessionOptions & { user: SessionUser }
): Session {
  const session = createMockSession(options)
  // Since Session constructor takes user, this will be preserved
  return new Session(
    session.id,
    session.userId,
    session.projectId,
    session.activityId,
    session.duration,
    session.createdAt,
    session.title,
    session.description,
    session.visibility,
    session.supportCount,
    session.commentCount,
    session.groupIds,
    options.user, // Use provided user
    session.activity
  )
}

export function createMockSessionBatch(
  count: number,
  baseOptions: CreateSessionOptions = {}
): Session[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSession({
      ...baseOptions,
      id: `session-batch-${i}`,
    })
  )
}

export function createMockSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: overrides.id || 'user-123',
    email: overrides.email || 'user@example.com',
    name: overrides.name || 'John Doe',
    username: overrides.username || 'johndoe',
    bio: overrides.bio || 'Test user bio',
    profilePicture: overrides.profilePicture,
    createdAt: overrides.createdAt || new Date('2024-01-01'),
    updatedAt: overrides.updatedAt || new Date('2024-01-15'),
  }
}

export function createMockSessionActivity(
  overrides: Partial<SessionActivity> = {}
): SessionActivity {
  return {
    id: overrides.id || 'activity-789',
    userId: overrides.userId || 'user-123',
    name: overrides.name || 'Coding Session',
    description: overrides.description || 'Working on new features',
    icon: overrides.icon || 'code',
    color: overrides.color || '#007AFF',
    status: overrides.status || 'active',
    isDefault: overrides.isDefault ?? false,
    createdAt: overrides.createdAt || new Date('2024-01-01'),
    updatedAt: overrides.updatedAt || new Date('2024-01-15'),
  }
}

export function resetSessionFactory(): void {
  sessionIdCounter = 1
  sessionCounter = 0
}
