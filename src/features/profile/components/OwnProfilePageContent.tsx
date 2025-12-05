/**
 * Own Profile Page Content Component (Clean Architecture)
 *
 * This component handles the current user's profile presentation logic.
 * Extracted from the route file for better separation of concerns.
 */

'use client'

import React, { useState, useMemo } from 'react'
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
  const displayTagline = userProfile?.tagline || user?.tagline
  const displayPronouns = userProfile?.pronouns || user?.pronouns

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
                    {displayPronouns && (
                      <p className="text-gray-500 text-xs md:text-sm mb-1">{displayPronouns}</p>
                    )}
                    <p className="text-gray-600 text-sm md:text-base mb-1 md:mb-2">
                      @{user.username}
                    </p>
                    {displayTagline && (
                      <p className="text-gray-700 text-sm md:text-base mb-2 md:mb-3 font-medium leading-snug">
                        {displayTagline}
                      </p>
                    )}

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

              {/* Progress Content */}
              <div className="mt-6">
                <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                  {/* Header with Time Period Selector and Chart Type */}
                  <div className="flex items-center justify-between gap-2 py-2 -mx-4 px-4 md:mx-0 md:px-0">
                    {/* Activity Filter Dropdown */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 min-h-[44px] min-w-[120px]"
                        aria-label="Filter by activity"
                        aria-expanded={showActivityDropdown}
                        aria-haspopup="listbox"
                      >
                        {selectedActivityId === 'all' ? (
                          <span className="font-medium">All Activities</span>
                        ) : (
                          <>
                            <IconRenderer
                              iconName={
                                activities.find((a) => a.id === selectedActivityId)?.icon || ''
                              }
                              className="w-4 h-4 flex-shrink-0"
                            />
                            <span className="font-medium">
                              {activities.find((a) => a.id === selectedActivityId)?.name || 'All'}
                            </span>
                          </>
                        )}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Activity Dropdown Menu */}
                      {showActivityDropdown && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowActivityDropdown(false)}
                          />
                          <div className="absolute left-0 top-full mt-2 w-56 md:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
                            <button
                              onClick={() => {
                                setSelectedActivityId('all')
                                setShowActivityDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                                selectedActivityId === 'all' ? 'bg-blue-50' : ''
                              }`}
                            >
                              <span className="flex-1 font-medium text-gray-900">
                                All Activities
                              </span>
                              {selectedActivityId === 'all' && (
                                <Check className="w-4 h-4 text-blue-500" />
                              )}
                            </button>
                            {activities.map((activity) => (
                              <button
                                key={activity.id}
                                onClick={() => {
                                  setSelectedActivityId(activity.id)
                                  setShowActivityDropdown(false)
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                                  selectedActivityId === activity.id ? 'bg-blue-50' : ''
                                }`}
                              >
                                <IconRenderer
                                  iconName={activity.icon}
                                  className="w-5 h-5 text-gray-700 flex-shrink-0"
                                />
                                <span className="flex-1 font-medium text-gray-900">
                                  {activity.name}
                                </span>
                                {selectedActivityId === activity.id && (
                                  <Check className="w-4 h-4 text-blue-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Time Period Buttons - Scrollable on mobile */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="overflow-x-auto flex items-center gap-1.5 md:gap-2 flex-1 scrollbar-hide">
                        {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => (
                          <button
                            key={period}
                            onClick={() => setTimePeriod(period)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 min-h-[44px] ${
                              timePeriod === period
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                            aria-label={`Show ${period} time period`}
                            aria-pressed={timePeriod === period}
                          >
                            {period}
                          </button>
                        ))}
                      </div>

                      {/* Chart Type Selector */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                          className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 min-h-[44px]"
                          aria-label={`Chart type: ${chartType}`}
                          aria-expanded={showChartTypeDropdown}
                          aria-haspopup="listbox"
                        >
                          {chartType === 'bar' ? (
                            <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                          )}
                          <span className="capitalize hidden sm:inline">{chartType}</span>
                          <ChevronDown className="w-3 h-3" aria-hidden="true" />
                        </button>

                        {/* Chart Type Dropdown */}
                        {showChartTypeDropdown && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowChartTypeDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <button
                                onClick={() => {
                                  setChartType('bar')
                                  setShowChartTypeDropdown(false)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                  chartType === 'bar'
                                    ? 'text-[#0066CC] font-medium'
                                    : 'text-gray-700'
                                }`}
                              >
                                {chartType === 'bar' && <span className="text-[#0066CC]">✓</span>}
                                <BarChart3 className="w-4 h-4" />
                                Bar
                              </button>
                              <button
                                onClick={() => {
                                  setChartType('line')
                                  setShowChartTypeDropdown(false)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                  chartType === 'line'
                                    ? 'text-[#0066CC] font-medium'
                                    : 'text-gray-700'
                                }`}
                              >
                                {chartType === 'line' && <span className="text-[#0066CC]">✓</span>}
                                <TrendingUp className="w-4 h-4" />
                                Line
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Chart */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900">Hours completed</h3>
                    </div>
                    <div className="h-72">
                      {isLoading ? (
                        <div className="h-full bg-gray-50 rounded animate-pulse" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
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
                              <Bar
                                dataKey="hours"
                                fill="#0066CC"
                                radius={[4, 4, 0, 0]}
                                name="Hours"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
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
                          )}
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Second Row - Two Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Average Session Duration */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">Average session duration</h3>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={avgDurationData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar
                                dataKey="value"
                                fill="#34C759"
                                radius={[4, 4, 0, 0]}
                                name="Minutes"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={avgDurationData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient id="colorAvgDuration" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#34C759" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#34C759"
                                strokeWidth={2}
                                fill="url(#colorAvgDuration)"
                                name="Minutes"
                              />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Sessions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">Sessions completed</h3>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar
                                dataKey="sessions"
                                fill="#34C759"
                                radius={[4, 4, 0, 0]}
                                name="Sessions"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient id="colorSessionsSmall" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#34C759" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="sessions"
                                stroke="#34C759"
                                strokeWidth={2}
                                fill="url(#colorSessionsSmall)"
                                name="Sessions"
                              />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - 5 columns */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Total Hours
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.totalHours.toFixed(1)}
                      </div>
                      {renderPercentageChange(calculatedStats.hoursChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Avg Duration
                      </div>
                      <div className="text-2xl font-bold mb-1">{calculatedStats.avgDuration}m</div>
                      {renderPercentageChange(calculatedStats.avgDurationChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Sessions
                      </div>
                      <div className="text-2xl font-bold mb-1">{calculatedStats.sessions}</div>
                      {renderPercentageChange(calculatedStats.sessionsChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Active Days
                      </div>
                      <div className="text-2xl font-bold mb-1">{calculatedStats.activeDays}</div>
                      {renderPercentageChange(calculatedStats.activeDaysChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Activities
                      </div>
                      <div className="text-2xl font-bold mb-1">{calculatedStats.activities}</div>
                      {renderPercentageChange(calculatedStats.activitiesChange)}
                    </div>
                  </div>

                  {/* Secondary Stats Grid - Streaks */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Current Streak
                      </div>
                      <div className="text-2xl font-bold mb-1">{calculatedStats.currentStreak}</div>
                      {renderPercentageChange(calculatedStats.streakChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Longest Streak
                      </div>
                      <div className="text-2xl font-bold mb-1">{calculatedStats.longestStreak}</div>
                      {renderPercentageChange(calculatedStats.streakChange)}
                    </div>
                  </div>
                </div>
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
