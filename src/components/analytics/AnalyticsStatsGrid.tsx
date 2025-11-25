export interface AnalyticsStats {
  totalHours: number
  sessions: number
  avgDuration: number
  currentStreak: number
  longestStreak: number
  activeDays: number
  activities: number
  hoursChange: number | null
  sessionsChange: number | null
  avgDurationChange: number | null
  activeDaysChange: number | null
  activitiesChange: number | null
  streakChange: number | null
}

export interface AnalyticsStatsGridProps {
  stats: AnalyticsStats
}

function renderPercentageChange(change: number | null) {
  if (change === null) return null

  const isPositive = change >= 0
  const formattedChange = Math.abs(change).toFixed(0)

  return (
    <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? '↑' : '↓'} {formattedChange}%
    </div>
  )
}

export function AnalyticsStatsGrid({ stats }: AnalyticsStatsGridProps) {
  return (
    <>
      {/* Stats Grid - 5 columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Total Hours</div>
          <div className="text-2xl font-bold mb-1">{stats.totalHours.toFixed(1)}</div>
          {renderPercentageChange(stats.hoursChange)}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Avg Duration</div>
          <div className="text-2xl font-bold mb-1">{stats.avgDuration}m</div>
          {renderPercentageChange(stats.avgDurationChange)}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Sessions</div>
          <div className="text-2xl font-bold mb-1">{stats.sessions}</div>
          {renderPercentageChange(stats.sessionsChange)}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Active Days</div>
          <div className="text-2xl font-bold mb-1">{stats.activeDays}</div>
          {renderPercentageChange(stats.activeDaysChange)}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Activities</div>
          <div className="text-2xl font-bold mb-1">{stats.activities}</div>
          {renderPercentageChange(stats.activitiesChange)}
        </div>
      </div>

      {/* Secondary Stats Grid - Streaks */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Current Streak</div>
          <div className="text-2xl font-bold mb-1">{stats.currentStreak}</div>
          {renderPercentageChange(stats.streakChange)}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Longest Streak</div>
          <div className="text-2xl font-bold mb-1">{stats.longestStreak}</div>
          {renderPercentageChange(stats.streakChange)}
        </div>
      </div>
    </>
  )
}
