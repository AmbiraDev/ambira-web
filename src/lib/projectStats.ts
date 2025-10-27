import { ProjectStats, Session } from '@/types';

/**
 * Calculate project statistics from sessions data
 */
export function calculateProjectStats(
  sessions: Session[],
  weeklyTarget?: number,
  totalTarget?: number
): ProjectStats {
  // Filter sessions for this project
  const projectSessions = sessions.filter(session => !session.isArchived);

  // Calculate total hours
  const totalHours = projectSessions.reduce((total, session) => {
    return total + (session.duration / 3600); // Convert seconds to hours
  }, 0);

  // Calculate weekly hours (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weeklySessions = projectSessions.filter(session =>
    new Date(session.createdAt) >= oneWeekAgo
  );
  
  const weeklyHours = weeklySessions.reduce((total, session) => {
    return total + (session.duration / 3600);
  }, 0);

  // Calculate session count
  const sessionCount = projectSessions.length;

  // Calculate current streak (days with at least one session)
  const currentStreak = calculateCurrentStreak(projectSessions);

  // Calculate progress percentages
  const weeklyProgressPercentage = weeklyTarget 
    ? Math.min(100, (weeklyHours / weeklyTarget) * 100)
    : 0;
    
  const totalProgressPercentage = totalTarget 
    ? Math.min(100, (totalHours / totalTarget) * 100)
    : 0;

  // Calculate average session duration (in minutes)
  const averageSessionDuration = sessionCount > 0 
    ? (totalHours * 60) / sessionCount
    : 0;

  // Find last session date
  const lastSessionDate = projectSessions.length > 0
    ? new Date(Math.max(...projectSessions.map(s => new Date(s.createdAt).getTime())))
    : undefined;

  return {
    totalHours,
    weeklyHours,
    sessionCount,
    currentStreak,
    weeklyProgressPercentage,
    totalProgressPercentage,
    averageSessionDuration,
    lastSessionDate,
  };
}

/**
 * Calculate current streak of days with at least one session
 */
function calculateCurrentStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  // Sort sessions by date (most recent first)
  const sortedSessions = sessions
    .map(session => ({
      date: new Date(session.createdAt).toDateString(),
      timestamp: new Date(session.createdAt).getTime()
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  // Get unique dates with sessions
  const uniqueDates = Array.from(new Set(sortedSessions.map(s => s.date)))
    .map(dateString => new Date(dateString))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDates.length === 0) return 0;

  // Check if we have a session today or yesterday
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayString = today.toDateString();
  const yesterdayString = yesterday.toDateString();

  // If no session today or yesterday, streak is broken
  const firstDate: Date | undefined = uniqueDates[0];
  if (!firstDate) {
    return 0;
  }

  const mostRecentDate = firstDate.toDateString();
  if (mostRecentDate !== todayString && mostRecentDate !== yesterdayString) {
    return 0;
  }

  // Calculate consecutive days
  let streak = 0;
  let currentDate: Date = new Date(firstDate);

  for (const sessionDate of uniqueDates) {
    const daysDifference = Math.floor(
      (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference === streak) {
      streak++;
      currentDate = new Date(sessionDate);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate projected completion date based on current progress
 */
export function calculateProjectedCompletion(
  totalHours: number,
  totalTarget: number,
  weeklyHours: number
): Date | null {
  if (!totalTarget || totalHours >= totalTarget || weeklyHours <= 0) {
    return null;
  }

  const remainingHours = totalTarget - totalHours;
  const weeksToComplete = remainingHours / weeklyHours;
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7));

  return completionDate;
}

/**
 * Calculate weekly average over the last N weeks
 */
export function calculateWeeklyAverage(
  sessions: Session[],
  weeks: number = 4
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));

  const recentSessions = sessions.filter(session =>
    new Date(session.createdAt) >= cutoffDate
  );

  const totalHours = recentSessions.reduce((total, session) => {
    return total + (session.duration / 3600);
  }, 0);

  return totalHours / weeks;
}

/**
 * Get productivity insights based on stats
 */
export function getProductivityInsights(stats: ProjectStats): string[] {
  const insights: string[] = [];

  if (stats.currentStreak >= 7) {
    insights.push(`🔥 Amazing! You've maintained a ${stats.currentStreak}-day streak!`);
  } else if (stats.currentStreak >= 3) {
    insights.push(`Great job! You're on a ${stats.currentStreak}-day streak.`);
  }

  if (stats.weeklyHours > 20) {
    insights.push(`📈 High productivity this week with ${stats.weeklyHours.toFixed(1)} hours logged!`);
  } else if (stats.weeklyHours < 5) {
    insights.push(`💡 Consider adding more focused time to reach your goals.`);
  }

  if (stats.averageSessionDuration > 90) {
    insights.push(`🎯 Excellent focus! Your average session is ${Math.round(stats.averageSessionDuration)} minutes.`);
  } else if (stats.averageSessionDuration < 30) {
    insights.push(`⏰ Try longer sessions for deeper work and better progress.`);
  }

  if (stats.totalProgressPercentage > 75) {
    insights.push(`🏆 You're ${stats.totalProgressPercentage.toFixed(1)}% to your total goal!`);
  }

  return insights;
}
