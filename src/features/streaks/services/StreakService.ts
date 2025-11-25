/**
 * Streak Service - Business Logic Layer
 */

import { firebaseApi } from '@/lib/api'
import { StreakData, StreakStats } from '@/types'

export class StreakService {
  async getStreakData(userId: string): Promise<StreakData | null> {
    try {
      return await firebaseApi.streak.getStreakData(userId)
    } catch (_err) {
      return null
    }
  }

  async getStreakStats(userId: string): Promise<StreakStats | null> {
    try {
      return await firebaseApi.streak.getStreakStats(userId)
    } catch (_err) {
      return null
    }
  }

  async updateStreakVisibility(userId: string, isPublic: boolean): Promise<void> {
    return firebaseApi.streak.updateStreakVisibility(userId, isPublic)
  }
}
