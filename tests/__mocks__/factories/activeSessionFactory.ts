/**
 * ActiveSession Domain Entity Factory
 * Creates mock active timer sessions for testing
 */

import { ActiveSession } from '@/domain/entities/ActiveSession'
import type { TimerStatus } from '@/domain/entities/ActiveSession'

interface CreateActiveSessionOptions {
  id?: string
  userId?: string
  projectId?: string
  startTime?: Date
  status?: TimerStatus
  pausedDuration?: number
  lastPausedAt?: Date
  activityId?: string | null
  title?: string
  description?: string
}

let sessionIdCounter = 1

export function createMockActiveSession(options: CreateActiveSessionOptions = {}): ActiveSession {
  const id = options.id || `active-session-${sessionIdCounter++}`
  const now = new Date()
  const startTime = options.startTime || new Date(now.getTime() - 3600000) // 1 hour ago

  return new ActiveSession(
    id,
    options.userId || 'user-123',
    options.projectId || 'project-456',
    startTime,
    options.status ?? 'running',
    options.pausedDuration ?? 0,
    options.lastPausedAt,
    options.activityId ?? 'activity-789',
    options.title ?? 'Active Session',
    options.description ?? 'Currently working'
  )
}

export function createMockRunningSession(options: CreateActiveSessionOptions = {}): ActiveSession {
  return createMockActiveSession({
    ...options,
    status: 'running',
    pausedDuration: 0,
    lastPausedAt: undefined,
  })
}

export function createMockPausedSession(options: CreateActiveSessionOptions = {}): ActiveSession {
  const now = new Date()
  return createMockActiveSession({
    ...options,
    status: 'paused',
    pausedDuration: options.pausedDuration ?? 300, // 5 minutes paused
    lastPausedAt: options.lastPausedAt ?? new Date(now.getTime() - 300000),
  })
}

export function createMockOldSession(options: CreateActiveSessionOptions = {}): ActiveSession {
  // Session started more than 24 hours ago
  const now = new Date()
  const OLD_START_TIME = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago

  return createMockActiveSession({
    ...options,
    startTime: OLD_START_TIME,
  })
}

export function createMockSessionBatch(
  count: number,
  baseOptions: CreateActiveSessionOptions = {}
): ActiveSession[] {
  return Array.from({ length: count }, (_, i) =>
    createMockActiveSession({
      ...baseOptions,
      id: `active-session-batch-${i}`,
    })
  )
}

export function resetActiveSessionFactory(): void {
  sessionIdCounter = 1
}
