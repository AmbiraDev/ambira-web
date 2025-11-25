/**
 * Groups Feature Types
 *
 * Type definitions specific to the groups feature module.
 */

import { User } from '@/domain/entities/User'

export type TimePeriod = 'today' | 'week' | 'month' | 'all-time'

export interface LeaderboardEntry {
  user: User
  totalHours: number
  sessionCount: number
  rank: number
}

export interface GroupStats {
  memberCount: number
  totalSessions: number
  totalHours: number
  activeMembersThisWeek: number
}
