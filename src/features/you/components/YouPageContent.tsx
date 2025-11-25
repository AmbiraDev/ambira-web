/**
 * You Page Content Component (Clean Architecture)
 *
 * Mobile-optimized view inspired by Strava's "You" page
 * Shows user's Progress and Sessions in tabbed interface
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'
import Footer from '@/components/Footer'
import Header from '@/components/HeaderComponent'
import { useUserSessions } from '@/features/sessions/hooks'
import { useProfileStats } from '@/features/profile/hooks'
import { useActivities } from '@/hooks/useActivitiesQuery'
import { Feed } from '@/features/feed/components/Feed'
import { Settings, BarChart3, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { XAxis, YAxis, ResponsiveContainer, Tooltip, Area, ComposedChart } from 'recharts'

type YouTab = 'progress' | 'sessions'
type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y'

interface ChartDataPoint {
  name: string
  hours: number
  sessions: number
  avgDuration: number
}

export function YouPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<YouTab>('progress')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D')
  const [selectedActivityId, setSelectedActivityId] = useState<string>('all')
  const [showActivityDropdown, setShowActivityDropdown] = useState(false)

  // Fetch data
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions(
    user?.id || '',
    undefined,
    {
      enabled: !!user?.id,
    }
  )
  const { data: stats, isLoading: statsLoading } = useProfileStats(user?.id || '', {
    enabled: !!user?.id,
  })
  const { data: activities = [] } = useActivities(user?.id)

  const isLoading = sessionsLoading || statsLoading

  // Filter sessions by activity
  const filteredSessions = useMemo(() => {
    if (selectedActivityId === 'all') {
      return sessions
    }
    return sessions.filter(
      (s) => s.activityId === selectedActivityId || s.projectId === selectedActivityId
    )
  }, [sessions, selectedActivityId])

  // Calculate stats for selected time period
  const calculatedStats = useMemo(() => {
    const now = new Date()

    const getDateRange = (period: TimePeriod) => {
      const end = new Date(now)
      const start = new Date(now)

      switch (period) {
        case '7D':
          start.setDate(now.getDate() - 7)
          break
        case '2W':
          start.setDate(now.getDate() - 14)
          break
        case '4W':
          start.setDate(now.getDate() - 28)
          break
        case '3M':
          start.setMonth(now.getMonth() - 3)
          break
        case '1Y':
          start.setFullYear(now.getFullYear() - 1)
          break
      }

      return { start, end }
    }

    const currentRange = getDateRange(timePeriod)

    const currentPeriodSessions = filteredSessions.filter((s) => {
      const sessionDate = new Date(s.createdAt)
      return sessionDate >= currentRange.start && sessionDate <= currentRange.end
    })

    const currentHours = currentPeriodSessions.reduce((sum, s) => sum + s.duration / 3600, 0)
    const currentSessionCount = currentPeriodSessions.length
    const currentAvgDuration =
      currentSessionCount > 0
        ? currentPeriodSessions.reduce((sum, s) => sum + s.duration, 0) / currentSessionCount / 60
        : 0

    const currentActiveDays = new Set(
      currentPeriodSessions.map((s) => new Date(s.createdAt).toDateString())
    ).size

    return {
      totalHours: currentHours,
      sessions: currentSessionCount,
      avgDuration: Math.round(currentAvgDuration),
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      activeDays: currentActiveDays,
      activities: (activities && activities.length) || 0,
    }
  }, [filteredSessions, stats, activities, timePeriod])

  // Chart data
  const chartData = useMemo(() => {
    if (!filteredSessions) return []
    const now = new Date()
    const data: ChartDataPoint[] = []

    if (timePeriod === '7D') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now)
        day.setDate(day.getDate() - i)
        const daySessions = filteredSessions.filter(
          (s) => new Date(s.createdAt).toDateString() === day.toDateString()
        )
        const hoursWorked = daySessions.reduce((sum, s) => sum + s.duration / 3600, 0)
        const avgDuration =
          daySessions.length > 0
            ? daySessions.reduce((sum, s) => sum + s.duration, 0) / daySessions.length / 60
            : 0
        const dayIndex = day.getDay()
        const dayName = dayNames[dayIndex]?.slice(0, 3) ?? 'Day'
        data.push({
          name: `${dayName} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration),
        })
      }
    }
    // Add other time periods as needed
    return data
  }, [filteredSessions, timePeriod])

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-semibold">{entry.name}</span>: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header with Profile Icon and Settings */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Profile Icon */}
          <Link href="/profile" className="flex items-center gap-2">
            {user.profilePicture ? (
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-300">
                <Image
                  src={user.profilePicture}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center ring-2 ring-gray-300">
                <span className="text-white font-semibold text-base">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          {/* Title */}
          <h1 className="text-lg font-semibold text-gray-900">You</h1>

          {/* Settings Icon */}
          <Link
            href="/settings"
            className="p-2 text-gray-600 hover:text-[#0066CC] transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('progress')}
            className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'progress' ? 'text-[#0066CC]' : 'text-gray-500'
            }`}
          >
            Progress
            {activeTab === 'progress' && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066CC]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sessions' ? 'text-[#0066CC]' : 'text-gray-500'
            }`}
          >
            Sessions
            {activeTab === 'sessions' && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066CC]" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-[6.5rem] md:pb-8">
        {activeTab === 'progress' ? (
          /* Progress Tab */
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
            {/* Controls */}
            <div className="space-y-3 mb-6">
              {/* Activity Selector */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC] min-w-[140px] max-w-[200px]"
                >
                  <span className="truncate">
                    {selectedActivityId === 'all'
                      ? 'All activities'
                      : activities?.find((p) => p.id === selectedActivityId)?.name ||
                        'All activities'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                </button>
                {showActivityDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowActivityDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-full max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedActivityId('all')
                          setShowActivityDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedActivityId === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        All activities
                      </button>
                      {activities?.map((activity) => (
                        <button
                          key={activity.id}
                          onClick={() => {
                            setSelectedActivityId(activity.id)
                            setShowActivityDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedActivityId === activity.id ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          {activity.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Time Period Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`flex-shrink-0 px-4 md:px-5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                      timePeriod === period
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">Hours completed</h3>
              <div className="h-72">
                {isLoading ? (
                  <div className="h-full bg-gray-50 rounded animate-pulse" />
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No session data yet
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Start tracking your sessions to see your progress!
                      </p>
                      <button
                        onClick={() => router.push('/timer')}
                        className="px-6 py-3 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] font-semibold"
                      >
                        Start Your First Session
                      </button>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0066CC" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="#0066CC"
                        strokeWidth={2}
                        fill="url(#colorHours)"
                        name="Hours"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                  Total Hours
                </div>
                <div className="text-2xl font-bold">{calculatedStats.totalHours.toFixed(1)}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Sessions</div>
                <div className="text-2xl font-bold">{calculatedStats.sessions}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                  Avg Duration
                </div>
                <div className="text-2xl font-bold">{calculatedStats.avgDuration}m</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                  Current Streak
                </div>
                <div className="text-2xl font-bold">{calculatedStats.currentStreak}</div>
              </div>
            </div>
          </div>
        ) : (
          /* Sessions Tab */
          <div className="max-w-4xl mx-auto">
            <Feed filters={{ type: 'user', userId: user?.id }} showEndMessage={true} />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
      <Footer />
    </div>
  )
}
