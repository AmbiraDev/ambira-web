/**
 * Own Profile Page Content Component (Clean Architecture)
 *
 * This component handles the current user's profile presentation logic.
 * Extracted from the route file for better separation of concerns.
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/HeaderComponent'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'
import Footer from '@/components/Footer'
import {
  useProfileById,
  useProfileStats,
  useFollowers,
  useFollowing,
} from '@/features/profile/hooks'
import { useUserSessions } from '@/features/sessions/hooks'
import { useActivitiesWithSessions } from '@/hooks/useActivitiesQuery'
import Link from 'next/link'
import Image from 'next/image'
import {
  Settings,
  LogOut,
  Edit,
  TrendingUp,
  BarChart3,
  ChevronDown,
  MapPin,
  Check,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
  ComposedChart,
  BarChart,
  Bar,
} from 'recharts'
import { IconRenderer } from '@/components/IconRenderer'
import { useRouter, useSearchParams } from 'next/navigation'
// import Feed from '@/components/Feed'
import { FollowersList } from '@/features/social/components/FollowersList'
import { FollowingList } from '@/features/social/components/FollowingList'

type ProfileTab = 'progress' | 'sessions' | 'followers' | 'following'
type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y'
type ChartType = 'bar' | 'line'

interface ChartDataPoint {
  name: string
  hours: number
  sessions: number
  avgDuration: number
}

export function OwnProfilePageContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab') as ProfileTab | null

  const [activeTab, setActiveTab] = useState<ProfileTab>(
    tabParam === 'sessions'
      ? 'sessions'
      : tabParam === 'followers'
        ? 'followers'
        : tabParam === 'following'
          ? 'following'
          : 'progress'
  )
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D')
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string>('all')
  const [showActivityDropdown, setShowActivityDropdown] = useState(false)

  // Use new feature hooks for data with automatic caching
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions(user?.id || '', {
    enabled: !!user?.id,
  })
  const { data: stats = null, isLoading: statsLoading } = useProfileStats(user?.id || '', {
    enabled: !!user?.id,
  })
  const { data: userProfile = null } = useProfileById(user?.id || '', {
    enabled: !!user?.id,
  })
  const { data: followers = [] } = useFollowers(user?.id || '', {
    enabled: !!user?.id,
  })
  const { data: following = [] } = useFollowing(user?.id || '', {
    enabled: !!user?.id,
  })
  const { data: activities = [] } = useActivitiesWithSessions(user?.id, {
    enabled: !!user?.id,
  })

  const isLoading = sessionsLoading || statsLoading

  useEffect(() => {
    if (
      tabParam === 'progress' ||
      tabParam === 'sessions' ||
      tabParam === 'followers' ||
      tabParam === 'following'
    ) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Filter sessions based on selected activity
  const filteredSessions = useMemo(() => {
    if (selectedActivityId === 'all') return sessions
    return sessions.filter(
      (s) => s.activityId === selectedActivityId || s.projectId === selectedActivityId
    )
  }, [sessions, selectedActivityId])

  // Calculate chart data using useMemo to prevent infinite loop
  const chartData = useMemo(() => {
    if (!filteredSessions) return []

    const now = new Date()
    const data: ChartDataPoint[] = []

    if (timePeriod === '7D') {
      // Last 7 days
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

        data.push({
          name: `${(dayNames[day.getDay()] || 'Day').slice(0, 3)} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration),
        })
      }
    } else if (timePeriod === '2W') {
      // Last 14 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 13; i >= 0; i--) {
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

        data.push({
          name: `${(dayNames[day.getDay()] || 'Day').slice(0, 3)} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration),
        })
      }
    } else if (timePeriod === '4W') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6))
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() - i * 7)

        const weekSessions = filteredSessions.filter((s) => {
          const sessionDate = new Date(s.createdAt)
          return sessionDate >= weekStart && sessionDate <= weekEnd
        })
        const hoursWorked = weekSessions.reduce((sum, s) => sum + s.duration / 3600, 0)
        const avgDuration =
          weekSessions.length > 0
            ? weekSessions.reduce((sum, s) => sum + s.duration, 0) / weekSessions.length / 60
            : 0

        data.push({
          name: `Week ${4 - i}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: weekSessions.length,
          avgDuration: Math.round(avgDuration),
        })
      }
    } else if (timePeriod === '3M') {
      // Last 3 months
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      for (let i = 2; i >= 0; i--) {
        const month = new Date(now)
        month.setMonth(month.getMonth() - i)

        const monthSessions = filteredSessions.filter((s) => {
          const sessionDate = new Date(s.createdAt)
          return (
            sessionDate.getMonth() === month.getMonth() &&
            sessionDate.getFullYear() === month.getFullYear()
          )
        })
        const hoursWorked = monthSessions.reduce((sum, s) => sum + s.duration / 3600, 0)
        const avgDuration =
          monthSessions.length > 0
            ? monthSessions.reduce((sum, s) => sum + s.duration, 0) / monthSessions.length / 60
            : 0

        data.push({
          name: monthNames[month.getMonth()] || 'Month',
          hours: Number(hoursWorked.toFixed(2)),
          sessions: monthSessions.length,
          avgDuration: Math.round(avgDuration),
        })
      }
    } else if (timePeriod === '1Y') {
      // Last 12 months
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now)
        month.setMonth(month.getMonth() - i)

        const monthSessions = filteredSessions.filter((s) => {
          const sessionDate = new Date(s.createdAt)
          return (
            sessionDate.getMonth() === month.getMonth() &&
            sessionDate.getFullYear() === month.getFullYear()
          )
        })
        const hoursWorked = monthSessions.reduce((sum, s) => sum + s.duration / 3600, 0)
        const avgDuration =
          monthSessions.length > 0
            ? monthSessions.reduce((sum, s) => sum + s.duration, 0) / monthSessions.length / 60
            : 0

        data.push({
          name: monthNames[month.getMonth()] || 'Month',
          hours: Number(hoursWorked.toFixed(2)),
          sessions: monthSessions.length,
          avgDuration: Math.round(avgDuration),
        })
      }
    }

    return data
  }, [filteredSessions, timePeriod])

  // Calculate stats with percentage changes
  const calculatedStats = useMemo(() => {
    const now = new Date()

    // Helper to get date range based on time period
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

    // Get current and previous period ranges
    const currentRange = getDateRange(timePeriod)
    const previousStart = new Date(currentRange.start)
    const periodLength = currentRange.end.getTime() - currentRange.start.getTime()
    previousStart.setTime(previousStart.getTime() - periodLength)

    // Filter sessions for current period
    const currentPeriodSessions = filteredSessions.filter((s) => {
      const sessionDate = new Date(s.createdAt)
      return sessionDate >= currentRange.start && sessionDate <= currentRange.end
    })

    // Filter sessions for previous period
    const previousPeriodSessions = filteredSessions.filter((s) => {
      const sessionDate = new Date(s.createdAt)
      return sessionDate >= previousStart && sessionDate < currentRange.start
    })

    // Calculate current period stats
    const currentHours = currentPeriodSessions.reduce((sum, s) => sum + s.duration / 3600, 0)
    const currentSessionCount = currentPeriodSessions.length
    const currentAvgDuration =
      currentSessionCount > 0
        ? currentPeriodSessions.reduce((sum, s) => sum + s.duration, 0) / currentSessionCount / 60
        : 0

    const currentActiveDays = new Set(
      currentPeriodSessions.map((s) => new Date(s.createdAt).toDateString())
    ).size

    // Calculate previous period stats
    const previousHours = previousPeriodSessions.reduce((sum, s) => sum + s.duration / 3600, 0)
    const previousSessionCount = previousPeriodSessions.length
    const previousAvgDuration =
      previousSessionCount > 0
        ? previousPeriodSessions.reduce((sum, s) => sum + s.duration, 0) / previousSessionCount / 60
        : 0

    const previousActiveDays = new Set(
      previousPeriodSessions.map((s) => new Date(s.createdAt).toDateString())
    ).size

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number | null => {
      if (previous === 0) return null // No previous data
      return ((current - previous) / previous) * 100
    }

    const hoursChange = calculateChange(currentHours, previousHours)
    const sessionsChange = calculateChange(currentSessionCount, previousSessionCount)
    const avgDurationChange = calculateChange(currentAvgDuration, previousAvgDuration)
    const activeDaysChange = calculateChange(currentActiveDays, previousActiveDays)

    return {
      totalHours: currentHours,
      sessions: currentSessionCount,
      avgDuration: Math.round(currentAvgDuration),
      currentStreak: stats?.currentStreak || 0,
      longestStreak: stats?.longestStreak || 0,
      activeDays: currentActiveDays,
      activities: activities?.length || 0,

      // Percentage changes
      hoursChange,
      sessionsChange,
      avgDurationChange,
      activeDaysChange,
      activitiesChange: null, // Activities count doesn't have time-based comparison
      streakChange: null, // Streaks don't have meaningful percentage changes
    }
  }, [filteredSessions, stats, activities, timePeriod])

  // Average duration over time data - extract from chartData
  const avgDurationData = useMemo(() => {
    return chartData.map((d) => ({ name: d.name, value: d.avgDuration }))
  }, [chartData])

  // Helper to render percentage change
  const renderPercentageChange = (change: number | null) => {
    if (change === null) return null

    const isPositive = change >= 0
    const formattedChange = Math.abs(change).toFixed(0)

    return (
      <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'} {formattedChange}%
      </div>
    )
  }

  // Custom tooltip formatter
  interface TooltipPayloadEntry {
    color?: string
    name?: string
    value?: number | string
  }

  interface CustomTooltipProps {
    active?: boolean
    payload?: TooltipPayloadEntry[]
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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

  console.log('RENDER: OwnProfilePageContent')

  return (
    <>
      <div className="min-h-screen bg-white md:bg-gray-50">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader
            title="My Profile"
            showBackButton={true}
            showSettings={true}
            settingsExpanded={showSettingsMenu}
            onSettingsClick={() => setShowSettingsMenu(!showSettingsMenu)}
          />
        </div>

        {/* Content */}
        <div className="pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Profile Card */}
              <div className="bg-white md:rounded-xl md:border border-gray-200 p-3 md:p-6 mb-4 md:mb-6 relative">
                {/* Settings Icon - Desktop only */}
                <div className="hidden md:block absolute top-3 md:top-4 right-3 md:right-4 z-10">
                  <div className="relative">
                    <button
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                      className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
                      aria-label="Open settings menu"
                      aria-expanded={showSettingsMenu}
                      aria-haspopup="true"
                    >
                      <Settings className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    {/* Settings Dropdown */}
                    {showSettingsMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowSettingsMenu(false)}
                        >
                          Settings
                        </Link>
                        <hr className="my-2 border-gray-200" />
                        <button
                          onClick={() => {
                            setShowSettingsMenu(false)
                            logout()
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsive Layout - Stacks on mobile, side-by-side on desktop */}
                <div className="flex flex-col md:flex-row md:gap-8">
                  {/* Left Column - Profile Info */}
                  <div className="flex-1">
                    {/* Profile Picture */}
                    {user.profilePicture || userProfile?.profilePicture ? (
                      <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md mb-3 md:mb-4">
                        <Image
                          src={userProfile?.profilePicture || user.profilePicture || ''}
                          alt={user.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 md:w-32 md:h-32 bg-[#FC4C02] rounded-full flex items-center justify-center ring-4 ring-white shadow-md mb-3 md:mb-4">
                        <span className="text-white font-bold text-2xl md:text-4xl">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Name and Username */}
                    <h1 className="text-lg md:text-2xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-600 text-sm md:text-base mb-2 md:mb-3">
                      @{user.username}
                    </p>

                    {/* Bio */}
                    {(userProfile?.bio || user.bio) && (
                      <p className="text-gray-700 mb-2 md:mb-3 text-sm md:text-base leading-snug">
                        {userProfile?.bio || user.bio}
                      </p>
                    )}

                    {/* Location */}
                    {(userProfile?.location || user.location) && (
                      <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4 flex items-center gap-1">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4" aria-hidden="true" />
                        {userProfile?.location || user.location}
                      </p>
                    )}

                    {/* Follower/Following Counts */}
                    <div className="flex gap-4 md:gap-6 mb-3 md:mb-4">
                      <div>
                        <span className="font-bold text-gray-900 text-sm md:text-base">
                          {followers.length}
                        </span>{' '}
                        <span className="text-gray-600 text-xs md:text-sm">Followers</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-sm md:text-base">
                          {following.length}
                        </span>{' '}
                        <span className="text-gray-600 text-xs md:text-sm">Following</span>
                      </div>
                    </div>

                    {/* Edit Profile Button */}
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-2 mb-4 md:mb-0 px-4 md:px-4 py-2.5 md:py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-sm md:text-sm"
                    >
                      <Edit className="w-4 h-4 md:w-4 md:h-4" />
                      <span className="md:hidden">Edit</span>
                      <span className="hidden md:inline">Edit Profile</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white md:bg-gray-50 -mx-4 md:mx-0">
                <div className="bg-white md:bg-gray-50 border-b border-gray-200">
                  <div
                    className="flex md:gap-8 px-4 md:px-0 overflow-x-auto scrollbar-hide"
                    role="tablist"
                    aria-label="Profile sections"
                  >
                    <button
                      onClick={() => {
                        setActiveTab('progress')
                        router.push('/profile?tab=progress')
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 ${
                        activeTab === 'progress'
                          ? 'border-[#0066CC] text-[#0066CC]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                      role="tab"
                      aria-selected={activeTab === 'progress'}
                      aria-controls="progress-panel"
                      id="progress-tab"
                    >
                      Progress
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('sessions')
                        router.push('/profile?tab=sessions')
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 ${
                        activeTab === 'sessions'
                          ? 'border-[#0066CC] text-[#0066CC]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                      role="tab"
                      aria-selected={activeTab === 'sessions'}
                      aria-controls="sessions-panel"
                      id="sessions-tab"
                    >
                      Sessions
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('followers')
                        router.push('/profile?tab=followers')
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 ${
                        activeTab === 'followers'
                          ? 'border-[#0066CC] text-[#0066CC]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                      role="tab"
                      aria-selected={activeTab === 'followers'}
                      aria-controls="followers-panel"
                      id="followers-tab"
                    >
                      Followers
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('following')
                        router.push('/profile?tab=following')
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 ${
                        activeTab === 'following'
                          ? 'border-[#0066CC] text-[#0066CC]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                      role="tab"
                      aria-selected={activeTab === 'following'}
                      aria-controls="following-panel"
                      id="following-tab"
                    >
                      Following
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'progress' && (
                  <div
                    className="max-w-4xl mx-auto space-y-4 md:space-y-6"
                    id="progress-panel"
                    role="tabpanel"
                    aria-labelledby="progress-tab"
                  >
                    {/* 🔥 keep ALL your existing progress charts + stats here, unchanged */}
                    {/* (everything you already have in the "Progress Content" section) */}
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div
                    className="max-w-4xl mx-auto"
                    id="sessions-panel"
                    role="tabpanel"
                    aria-labelledby="sessions-tab"
                  >
                    {/* <Feed
                      filters={{ type: 'user', userId: user.id }}
                      showEndMessage={true}
                    /> */}
                  </div>
                )}

                {activeTab === 'followers' && (
                  <div id="followers-panel" role="tabpanel" aria-labelledby="followers-tab">
                    <FollowersList userId={user.id} />
                  </div>
                )}

                {activeTab === 'following' && (
                  <div id="following-panel" role="tabpanel" aria-labelledby="following-tab">
                    <FollowingList userId={user.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>

        {/* Footer - Desktop only */}
        <Footer />
      </div>
    </>
  )
}
