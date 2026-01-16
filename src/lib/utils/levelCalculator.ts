/**
 * Level Calculator Utility
 *
 * Calculates user level based on total hours logged.
 * Uses a Duolingo-inspired progression system where each level
 * requires progressively more hours.
 */

export interface LevelInfo {
  level: number
  currentXP: number // Hours in current level
  xpForNextLevel: number // Hours needed to complete current level
  progressPercent: number // 0-100 progress through current level
  totalHours: number
}

/**
 * XP thresholds for each level (in hours)
 * Level 1: 0-5 hours (5 hours)
 * Level 2: 5-15 hours (10 hours)
 * Level 3: 15-30 hours (15 hours)
 * Level 4: 30-50 hours (20 hours)
 * Level 5: 50-80 hours (30 hours)
 * Level 6: 80-120 hours (40 hours)
 * Level 7: 120-170 hours (50 hours)
 * Level 8: 170-230 hours (60 hours)
 * Level 9: 230-300 hours (70 hours)
 * Level 10: 300-400 hours (100 hours)
 * Level 11+: +100 hours each
 */
const LEVEL_THRESHOLDS = [0, 5, 15, 30, 50, 80, 120, 170, 230, 300, 400]

/**
 * Calculate user level and progress from total hours
 */
export function calculateLevel(totalHours: number): LevelInfo {
  if (totalHours <= 0) {
    return {
      level: 1,
      currentXP: 0,
      xpForNextLevel: LEVEL_THRESHOLDS[1] ?? 5,
      progressPercent: 0,
      totalHours: 0,
    }
  }

  // Find current level
  let level = 1
  let previousThreshold = 0

  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    const threshold = LEVEL_THRESHOLDS[i]
    if (threshold !== undefined && totalHours >= threshold) {
      level = i + 1
      previousThreshold = threshold
    } else {
      break
    }
  }

  // Handle levels beyond the predefined thresholds (Level 11+)
  if (level >= LEVEL_THRESHOLDS.length) {
    const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] ?? 400
    const extraHours = totalHours - lastThreshold
    const additionalLevels = Math.floor(extraHours / 100)
    level = LEVEL_THRESHOLDS.length + additionalLevels
    previousThreshold = lastThreshold + additionalLevels * 100
  }

  // Calculate XP within current level
  const nextThreshold =
    level < LEVEL_THRESHOLDS.length
      ? (LEVEL_THRESHOLDS[level] ?? previousThreshold + 100)
      : previousThreshold + 100

  const currentXP = totalHours - previousThreshold
  const xpForNextLevel = nextThreshold - previousThreshold
  const progressPercent = Math.min(100, (currentXP / xpForNextLevel) * 100)

  return {
    level,
    currentXP: Math.round(currentXP * 10) / 10,
    xpForNextLevel,
    progressPercent: Math.round(progressPercent),
    totalHours: Math.round(totalHours * 10) / 10,
  }
}

/**
 * Get a descriptive title for the user's level
 */
export function getLevelTitle(level: number): string {
  if (level <= 2) return 'Beginner'
  if (level <= 4) return 'Novice'
  if (level <= 6) return 'Apprentice'
  if (level <= 8) return 'Journeyman'
  if (level <= 10) return 'Expert'
  if (level <= 15) return 'Master'
  if (level <= 20) return 'Grandmaster'
  return 'Legend'
}
