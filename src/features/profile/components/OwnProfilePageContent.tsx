/**
 * Own Profile Page Content Component (Clean Architecture)
 *
 * This component handles the current user's profile presentation logic.
 * Extracted from the route file for better separation of concerns.
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LeftSidebar from '@/components/LeftSidebar'
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
  Check,
  Star,
  Flame,
  Clock,
  Users,
  UserPlus,
  BookOpen,
  Play,
} from 'lucide-react'
import { useUserLevel } from '@/hooks/useUserLevel'
import { getLevelTitle } from '@/lib/utils/levelCalculator'
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
import { Feed } from '@/features/feed/components/Feed'
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
  const { levelInfo, isLoading: levelLoading } = useUserLevel(user?.id)

  const isLoading = sessionsLoading || statsLoading || levelLoading

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

  if (!user) return null

  console.log('RENDER: OwnProfilePageContent')

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#F7F7F7] lg:bg-gray-50">
        {/* Main Content Area */}
        <div className="flex-1">
          <div className="flex justify-center">
            {/* Left Sidebar - Fixed, hidden on mobile */}
            <div className="hidden lg:block flex-shrink-0">
              <LeftSidebar />
            </div>

            {/* Content - with left margin on desktop to account for fixed sidebar */}
            <div className="flex-1 lg:ml-[256px] pb-32 lg:pb-8">
              {/* Mobile: edge-to-edge, Desktop: padded with max-width */}
              <div className="lg:max-w-7xl lg:mx-auto lg:px-6 lg:py-6">
                <div className="lg:max-w-4xl lg:mx-auto">
                  {/* Duolingo-Style Profile Header */}
                  <div className="bg-white lg:rounded-2xl lg:border-2 lg:border-[#E5E5E5] overflow-hidden mb-0 lg:mb-6 relative">
                    {/* Gradient Header Background - taller on mobile for app feel */}
                    <div className="bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] pt-6 lg:pt-8 pb-14 lg:pb-16 px-4 relative">
                      {/* Settings Icon */}
                      <div className="absolute top-3 right-3 z-10">
                        <div className="relative">
                          <button
                            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1CB0F6]"
                            aria-label="Open settings menu"
                            aria-expanded={showSettingsMenu}
                            aria-haspopup="true"
                          >
                            <Settings className="w-5 h-5" />
                          </button>

                          {/* Settings Dropdown */}
                          {showSettingsMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border-2 border-[#E5E5E5] py-2 z-10">
                              <Link
                                href="/settings"
                                className="block px-4 py-2.5 text-sm font-bold text-[#3C3C3C] hover:bg-[#F7F7F7] transition-colors"
                                onClick={() => setShowSettingsMenu(false)}
                              >
                                Settings
                              </Link>
                              <hr className="my-2 border-[#E5E5E5]" />
                              <button
                                onClick={() => {
                                  setShowSettingsMenu(false)
                                  logout()
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#FF4B4B] hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <LogOut className="w-4 h-4" />
                                Log Out
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile Content - Overlaps gradient */}
                    <div className="px-4 lg:px-6 -mt-10 lg:-mt-12 pb-5 lg:pb-6">
                      {/* Avatar with Level Badge */}
                      <div className="flex flex-col items-center text-center mb-3 lg:mb-4">
                        <div className="relative mb-2 lg:mb-3">
                          {user.profilePicture || userProfile?.profilePicture ? (
                            <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                              <Image
                                src={userProfile?.profilePicture || user.profilePicture || ''}
                                alt={user.name}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 lg:w-28 lg:h-28 bg-[#1CB0F6] rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                              <span className="text-white font-extrabold text-2xl lg:text-4xl">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Level Badge */}
                          <div className="absolute -bottom-0.5 -right-0.5 lg:-bottom-1 lg:-right-1 bg-[#FFD900] text-[#3C3C3C] text-xs lg:text-sm font-extrabold px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full border-2 border-white shadow-sm">
                            {levelInfo?.level ?? 1}
                          </div>
                        </div>

                        {/* Name */}
                        <h1 className="text-lg lg:text-2xl font-extrabold text-[#3C3C3C] mb-0.5 lg:mb-1">
                          {user.name}
                        </h1>

                        {/* Username and Join Date */}
                        <p className="text-xs lg:text-sm font-bold text-[#AFAFAF] uppercase tracking-wide mb-3 lg:mb-4">
                          @{user.username.toUpperCase()} · JOINED{' '}
                          {user.createdAt
                            ? new Date(user.createdAt).getFullYear()
                            : new Date().getFullYear()}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center justify-center gap-6 lg:gap-8 mb-3 lg:mb-4">
                          <div className="text-center">
                            <div className="text-xl lg:text-2xl font-extrabold text-[#3C3C3C]">
                              {following.length}
                            </div>
                            <div className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                              Following
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl lg:text-2xl font-extrabold text-[#3C3C3C]">
                              {followers.length}
                            </div>
                            <div className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                              Followers
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:gap-3">
                          <Link
                            href="/search"
                            className="flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-white border-2 border-[#E5E5E5] text-[#3C3C3C] hover:bg-[#F7F7F7] rounded-xl transition-colors font-extrabold text-xs lg:text-sm"
                          >
                            <UserPlus className="w-4 h-4 lg:w-5 lg:h-5" />
                            ADD FRIENDS
                          </Link>
                          <Link
                            href="/settings"
                            className="p-2.5 lg:p-3 bg-white border-2 border-[#E5E5E5] text-[#3C3C3C] hover:bg-[#F7F7F7] rounded-xl transition-colors"
                            aria-label="Edit Profile"
                          >
                            <Edit className="w-4 h-4 lg:w-5 lg:h-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overview Section - Mobile: 2x2 grid with larger elements, Desktop: cards */}
                  <div className="px-4 lg:px-0 py-3 lg:py-0 lg:mb-6">
                    <h2 className="text-xs lg:text-xs font-bold text-[#AFAFAF] uppercase tracking-widest mb-3 lg:mb-3">
                      Overview
                    </h2>
                    {/* Mobile: 2x2 Duolingo-style grid with larger icons */}
                    <div className="lg:hidden grid grid-cols-2 gap-3">
                      {/* Streak Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
                        <div className="w-12 h-12 mb-2 bg-gradient-to-br from-[#FF9600] to-[#FF6B00] rounded-xl flex items-center justify-center shadow-sm">
                          <Flame className="w-7 h-7 text-white" fill="white" />
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          {stats?.currentStreak ?? 0}
                        </div>
                        <div className="text-[10px] font-bold text-[#AFAFAF] uppercase tracking-wide">
                          Day Streak
                        </div>
                      </div>
                      {/* Level Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
                        <div className="w-12 h-12 mb-2 bg-gradient-to-br from-[#FFD900] to-[#FFAA00] rounded-xl flex items-center justify-center shadow-sm">
                          <Star className="w-7 h-7 text-white" fill="white" />
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          Level {levelInfo?.level ?? 1}
                        </div>
                        <div className="text-[10px] font-bold text-[#AFAFAF] uppercase tracking-wide">
                          {getLevelTitle(levelInfo?.level ?? 1)}
                        </div>
                      </div>
                      {/* Hours Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
                        <div className="w-12 h-12 mb-2 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-xl flex items-center justify-center shadow-sm">
                          <Clock className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          {levelInfo?.totalHours ?? 0}h
                        </div>
                        <div className="text-[10px] font-bold text-[#AFAFAF] uppercase tracking-wide">
                          Total Hours
                        </div>
                      </div>
                      {/* Sessions Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
                        <div className="w-12 h-12 mb-2 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-xl flex items-center justify-center shadow-sm">
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          {sessions.length}
                        </div>
                        <div className="text-[10px] font-bold text-[#AFAFAF] uppercase tracking-wide">
                          Sessions
                        </div>
                      </div>
                    </div>
                    {/* Desktop: 4-column card grid */}
                    <div className="hidden lg:grid grid-cols-4 gap-3">
                      {/* Streak Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 hover:border-[#DDF4FF] transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#FF9600] to-[#FF7700] rounded-xl flex items-center justify-center">
                            <Flame className="w-6 h-6 text-white" fill="white" />
                          </div>
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          {stats?.currentStreak ?? 0}
                        </div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                          Day Streak
                        </div>
                      </div>

                      {/* Level Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 hover:border-[#DDF4FF] transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#FFD900] to-[#E5B400] rounded-xl flex items-center justify-center">
                            <Star className="w-6 h-6 text-white" fill="white" />
                          </div>
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          Level {levelInfo?.level ?? 1}
                        </div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                          {getLevelTitle(levelInfo?.level ?? 1)}
                        </div>
                      </div>

                      {/* Total Hours Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 hover:border-[#DDF4FF] transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          {levelInfo?.totalHours ?? 0}h
                        </div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                          Total Time
                        </div>
                      </div>

                      {/* Sessions Card */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 hover:border-[#DDF4FF] transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="text-2xl font-extrabold text-[#3C3C3C]">
                          {sessions.length}
                        </div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                          Sessions
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Level Progress Section - Mobile Only */}
                  <div className="lg:hidden px-4 py-3">
                    <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#FFD900] text-[#3C3C3C] text-sm font-extrabold px-3 py-1 rounded-full border-2 border-[#E5B400]">
                            Lv.{levelInfo?.level ?? 1}
                          </div>
                          <span className="text-sm font-bold text-[#777777]">
                            {getLevelTitle(levelInfo?.level ?? 1)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#AFAFAF]">
                          {((levelInfo?.xpForNextLevel ?? 5) - (levelInfo?.currentXP ?? 0)).toFixed(
                            1
                          )}
                          h to next level
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-4 bg-[#E5E5E5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FFD900] to-[#FFAA00] rounded-full transition-all duration-500"
                          style={{ width: `${levelInfo?.progressPercent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Last 7 Days Chart Section - Hide on mobile when no data */}
                  <div
                    className={`bg-white lg:rounded-2xl lg:border-2 lg:border-[#E5E5E5] px-4 py-4 lg:p-6 mb-0 lg:mb-6 lg:hover:border-[#DDF4FF] transition-colors ${sessions.length === 0 ? 'hidden lg:block' : ''}`}
                  >
                    <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#CE82FF] to-[#A855F7] rounded-lg lg:rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <h2 className="text-base lg:text-lg font-extrabold text-[#3C3C3C]">
                        Last 7 Days
                      </h2>
                    </div>
                    <div className="h-40 lg:h-48">
                      {isLoading ? (
                        <div className="h-full bg-[#F7F7F7] rounded-xl animate-pulse" />
                      ) : chartData.slice(-7).every((d) => d.hours === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-center bg-[#F7F7F7] rounded-xl px-4">
                          <div className="w-10 h-10 bg-[#E5E5E5] rounded-xl flex items-center justify-center mb-2">
                            <BarChart3 className="w-5 h-5 text-[#AFAFAF]" />
                          </div>
                          <p className="text-sm font-bold text-[#777777]">
                            No activity in the last 7 days
                          </p>
                          <Link
                            href="/timer"
                            className="text-xs font-bold text-[#1CB0F6] hover:underline mt-1"
                          >
                            Start a session →
                          </Link>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData.slice(-7)}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#58CC02" />
                                <stop offset="100%" stopColor="#45A000" />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#AFAFAF', fontWeight: 700 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis hide />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-3">
                                      <p className="text-sm font-extrabold text-[#3C3C3C] mb-1">
                                        {label}
                                      </p>
                                      <p className="text-sm font-bold text-[#58CC02]">
                                        {payload[0].value}h worked
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Bar
                              dataKey="hours"
                              fill="url(#barGradient)"
                              radius={[8, 8, 8, 8]}
                              name="Hours"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Duolingo-Style Tabs - Mobile: larger touch targets, Desktop: cards */}
                  <div className="bg-white lg:rounded-2xl lg:border-2 lg:border-[#E5E5E5] px-4 lg:p-3 py-3 mb-0 lg:mb-4">
                    <div
                      className="flex gap-2 lg:gap-3 overflow-x-auto scrollbar-hide"
                      role="tablist"
                      aria-label="Profile sections"
                    >
                      <button
                        onClick={() => {
                          setActiveTab('progress')
                          router.push('/profile?tab=progress')
                        }}
                        className={`flex items-center gap-2 px-4 lg:px-5 py-3 lg:py-3 min-h-[44px] rounded-xl text-sm font-extrabold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2 ${
                          activeTab === 'progress'
                            ? 'bg-[#DDF4FF] text-[#1CB0F6] border-2 border-b-4 border-[#1CB0F6] active:border-b-2 active:translate-y-[2px]'
                            : 'text-[#AFAFAF] hover:bg-[#F7F7F7] border-2 border-transparent'
                        }`}
                        role="tab"
                        aria-selected={activeTab === 'progress'}
                        aria-controls="progress-panel"
                        id="progress-tab"
                      >
                        <TrendingUp className="w-5 h-5" />
                        Progress
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('sessions')
                          router.push('/profile?tab=sessions')
                        }}
                        className={`flex items-center gap-2 px-4 lg:px-5 py-3 lg:py-3 min-h-[44px] rounded-xl text-sm font-extrabold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2 ${
                          activeTab === 'sessions'
                            ? 'bg-[#DDF4FF] text-[#1CB0F6] border-2 border-b-4 border-[#1CB0F6] active:border-b-2 active:translate-y-[2px]'
                            : 'text-[#AFAFAF] hover:bg-[#F7F7F7] border-2 border-transparent'
                        }`}
                        role="tab"
                        aria-selected={activeTab === 'sessions'}
                        aria-controls="sessions-panel"
                        id="sessions-tab"
                      >
                        <BookOpen className="w-5 h-5" />
                        Sessions
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('followers')
                          router.push('/profile?tab=followers')
                        }}
                        className={`flex items-center gap-2 px-4 lg:px-5 py-3 lg:py-3 min-h-[44px] rounded-xl text-sm font-extrabold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2 ${
                          activeTab === 'followers'
                            ? 'bg-[#DDF4FF] text-[#1CB0F6] border-2 border-b-4 border-[#1CB0F6] active:border-b-2 active:translate-y-[2px]'
                            : 'text-[#AFAFAF] hover:bg-[#F7F7F7] border-2 border-transparent'
                        }`}
                        role="tab"
                        aria-selected={activeTab === 'followers'}
                        aria-controls="followers-panel"
                        id="followers-tab"
                      >
                        <Users className="w-5 h-5" />
                        Followers
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('following')
                          router.push('/profile?tab=following')
                        }}
                        className={`flex items-center gap-2 px-4 lg:px-5 py-3 lg:py-3 min-h-[44px] rounded-xl text-sm font-extrabold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2 ${
                          activeTab === 'following'
                            ? 'bg-[#DDF4FF] text-[#1CB0F6] border-2 border-b-4 border-[#1CB0F6] active:border-b-2 active:translate-y-[2px]'
                            : 'text-[#AFAFAF] hover:bg-[#F7F7F7] border-2 border-transparent'
                        }`}
                        role="tab"
                        aria-selected={activeTab === 'following'}
                        aria-controls="following-panel"
                        id="following-tab"
                      >
                        <UserPlus className="w-5 h-5" />
                        Following
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-2 lg:mt-6 px-0 lg:px-0">
                    {activeTab === 'progress' && (
                      <div
                        className="lg:max-w-4xl lg:mx-auto space-y-0 lg:space-y-6"
                        id="progress-panel"
                        role="tabpanel"
                        aria-labelledby="progress-tab"
                      >
                        {/* Header with Time Period Selector and Chart Type - Duolingo Style */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 px-4 lg:px-0 py-2">
                          {/* Activity Filter Dropdown */}
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold text-[#3C3C3C] bg-white border-2 border-[#E5E5E5] rounded-xl hover:bg-[#F7F7F7] transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2 min-h-[44px]"
                              aria-label="Filter by activity"
                              aria-expanded={showActivityDropdown}
                              aria-haspopup="listbox"
                            >
                              {selectedActivityId === 'all' ? (
                                <span>All Activities</span>
                              ) : (
                                <>
                                  <IconRenderer
                                    iconName={
                                      activities.find((a) => a.id === selectedActivityId)?.icon ||
                                      ''
                                    }
                                    className="w-5 h-5 flex-shrink-0"
                                  />
                                  <span>
                                    {activities.find((a) => a.id === selectedActivityId)?.name ||
                                      'All'}
                                  </span>
                                </>
                              )}
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Activity Dropdown Menu */}
                            {showActivityDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setShowActivityDropdown(false)}
                                />
                                <div className="absolute left-0 top-full mt-2 w-56 lg:w-64 bg-white rounded-xl shadow-lg border-2 border-[#E5E5E5] py-2 z-50 max-h-64 overflow-y-auto">
                                  <button
                                    onClick={() => {
                                      setSelectedActivityId('all')
                                      setShowActivityDropdown(false)
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[#F7F7F7] transition-colors flex items-center gap-3 ${
                                      selectedActivityId === 'all' ? 'bg-[#DDF4FF]' : ''
                                    }`}
                                  >
                                    <span className="flex-1 text-[#3C3C3C]">All Activities</span>
                                    {selectedActivityId === 'all' && (
                                      <Check className="w-4 h-4 text-[#1CB0F6]" />
                                    )}
                                  </button>
                                  {activities.map((activity) => (
                                    <button
                                      key={activity.id}
                                      onClick={() => {
                                        setSelectedActivityId(activity.id)
                                        setShowActivityDropdown(false)
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[#F7F7F7] transition-colors flex items-center gap-3 ${
                                        selectedActivityId === activity.id ? 'bg-[#DDF4FF]' : ''
                                      }`}
                                    >
                                      <IconRenderer
                                        iconName={activity.icon}
                                        className="w-5 h-5 text-[#3C3C3C] flex-shrink-0"
                                      />
                                      <span className="flex-1 text-[#3C3C3C]">{activity.name}</span>
                                      {selectedActivityId === activity.id && (
                                        <Check className="w-4 h-4 text-[#1CB0F6]" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Time Period Buttons */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-start lg:justify-end">
                            <div className="overflow-x-auto flex items-center gap-2 scrollbar-hide">
                              {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => (
                                <button
                                  key={period}
                                  onClick={() => setTimePeriod(period)}
                                  className={`px-4 py-2.5 text-sm font-extrabold rounded-xl transition-all whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2 min-h-[44px] min-w-[44px] ${
                                    timePeriod === period
                                      ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#0088CC] active:border-b-2 active:translate-y-[2px]'
                                      : 'bg-white text-[#AFAFAF] border-2 border-[#E5E5E5] hover:bg-[#F7F7F7]'
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
                                className="flex items-center gap-2 px-3 py-2.5 text-sm font-extrabold text-[#3C3C3C] bg-white border-2 border-[#E5E5E5] rounded-xl hover:bg-[#F7F7F7] transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2 min-h-[44px]"
                                aria-label={`Chart type: ${chartType}`}
                                aria-expanded={showChartTypeDropdown}
                                aria-haspopup="listbox"
                              >
                                {chartType === 'bar' ? (
                                  <BarChart3 className="w-5 h-5" aria-hidden="true" />
                                ) : (
                                  <TrendingUp className="w-5 h-5" aria-hidden="true" />
                                )}
                                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                              </button>

                              {/* Chart Type Dropdown */}
                              {showChartTypeDropdown && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowChartTypeDropdown(false)}
                                  />
                                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border-2 border-[#E5E5E5] py-2 z-50">
                                    <button
                                      onClick={() => {
                                        setChartType('bar')
                                        setShowChartTypeDropdown(false)
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[#F7F7F7] transition-colors flex items-center gap-3 ${
                                        chartType === 'bar'
                                          ? 'text-[#1CB0F6] bg-[#DDF4FF]'
                                          : 'text-[#3C3C3C]'
                                      }`}
                                    >
                                      <BarChart3 className="w-5 h-5" />
                                      Bar
                                    </button>
                                    <button
                                      onClick={() => {
                                        setChartType('line')
                                        setShowChartTypeDropdown(false)
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[#F7F7F7] transition-colors flex items-center gap-3 ${
                                        chartType === 'line'
                                          ? 'text-[#1CB0F6] bg-[#DDF4FF]'
                                          : 'text-[#3C3C3C]'
                                      }`}
                                    >
                                      <TrendingUp className="w-5 h-5" />
                                      Line
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Main Chart - Duolingo Style */}
                        <div className="bg-white lg:rounded-2xl lg:border-2 lg:border-[#E5E5E5] px-4 py-4 lg:p-6 lg:hover:border-[#DDF4FF] transition-colors border-t border-b border-[#E5E5E5] lg:border-t-0 lg:border-b-0">
                          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-lg lg:rounded-xl flex items-center justify-center">
                              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                            </div>
                            <h3 className="text-base lg:text-lg font-extrabold text-[#3C3C3C]">
                              Hours Completed
                            </h3>
                          </div>
                          <div className="h-56 lg:h-72">
                            {isLoading ? (
                              <div className="h-full bg-[#F7F7F7] rounded-xl animate-pulse" />
                            ) : sessions.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                  <Play
                                    className="w-8 h-8 lg:w-10 lg:h-10 text-white ml-1"
                                    fill="white"
                                  />
                                </div>
                                <h4 className="text-lg font-extrabold text-[#3C3C3C] mb-2">
                                  Start your first session!
                                </h4>
                                <p className="text-sm text-[#777777] mb-4 max-w-xs">
                                  Track your work sessions to see your progress and build streaks.
                                </p>
                                <Link
                                  href="/timer"
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#58CC02] text-white font-extrabold text-sm rounded-xl border-2 border-b-4 border-[#45A000] hover:brightness-105 transition-all active:border-b-2 active:translate-y-[2px] uppercase tracking-wide"
                                >
                                  <Play className="w-4 h-4" fill="white" />
                                  Start Session
                                </Link>
                              </div>
                            ) : chartData.every((d) => d.hours === 0) ? (
                              <div className="h-full flex flex-col items-center justify-center text-center bg-[#F7F7F7] rounded-xl px-4">
                                <div className="w-12 h-12 bg-[#E5E5E5] rounded-xl flex items-center justify-center mb-3">
                                  <BarChart3 className="w-6 h-6 text-[#AFAFAF]" />
                                </div>
                                <h4 className="text-base font-extrabold text-[#3C3C3C] mb-1">
                                  No activity this period
                                </h4>
                                <p className="text-sm text-[#777777] mb-3">
                                  Log sessions to see your progress!
                                </p>
                                <Link
                                  href="/timer"
                                  className="text-sm font-bold text-[#1CB0F6] hover:underline"
                                >
                                  Start a session →
                                </Link>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'bar' ? (
                                  <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="hoursBarGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop offset="0%" stopColor="#1CB0F6" />
                                        <stop offset="100%" stopColor="#0088CC" />
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 11, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 11, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                      width={40}
                                    />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-3">
                                              <p className="text-sm font-extrabold text-[#3C3C3C] mb-1">
                                                {label}
                                              </p>
                                              <p className="text-sm font-bold text-[#1CB0F6]">
                                                {payload[0].value}h worked
                                              </p>
                                            </div>
                                          )
                                        }
                                        return null
                                      }}
                                    />
                                    <Bar
                                      dataKey="hours"
                                      fill="url(#hoursBarGradient)"
                                      radius={[8, 8, 8, 8]}
                                      name="Hours"
                                    />
                                  </BarChart>
                                ) : (
                                  <ComposedChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1CB0F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1CB0F6" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 11, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 11, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                      width={40}
                                    />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-3">
                                              <p className="text-sm font-extrabold text-[#3C3C3C] mb-1">
                                                {label}
                                              </p>
                                              <p className="text-sm font-bold text-[#1CB0F6]">
                                                {payload[0].value}h worked
                                              </p>
                                            </div>
                                          )
                                        }
                                        return null
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="hours"
                                      stroke="#1CB0F6"
                                      strokeWidth={3}
                                      fill="url(#colorHours)"
                                      name="Hours"
                                    />
                                  </ComposedChart>
                                )}
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>

                        {/* Second Row - Two Charts - Hide on mobile when no data */}
                        <div
                          className={`grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-4 mt-0 lg:mt-4 ${sessions.length === 0 ? 'hidden lg:grid' : ''}`}
                        >
                          {/* Average Session Duration */}
                          <div className="bg-white lg:rounded-2xl lg:border-2 lg:border-[#E5E5E5] px-4 py-4 lg:p-6 lg:hover:border-[#DDF4FF] transition-colors border-b border-[#E5E5E5] lg:border-b-0">
                            <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                              </div>
                              <h3 className="text-sm lg:text-base font-extrabold text-[#3C3C3C]">
                                Avg Session Duration
                              </h3>
                            </div>
                            <div className="h-40 lg:h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'bar' ? (
                                  <BarChart
                                    data={avgDurationData}
                                    margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="durationBarGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop offset="0%" stopColor="#58CC02" />
                                        <stop offset="100%" stopColor="#45A000" />
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 10, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-3">
                                              <p className="text-sm font-extrabold text-[#3C3C3C] mb-1">
                                                {label}
                                              </p>
                                              <p className="text-sm font-bold text-[#58CC02]">
                                                {payload[0].value}m avg
                                              </p>
                                            </div>
                                          )
                                        }
                                        return null
                                      }}
                                    />
                                    <Bar
                                      dataKey="value"
                                      fill="url(#durationBarGradient)"
                                      radius={[6, 6, 6, 6]}
                                      name="Minutes"
                                    />
                                  </BarChart>
                                ) : (
                                  <ComposedChart
                                    data={avgDurationData}
                                    margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="colorAvgDuration"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop offset="5%" stopColor="#58CC02" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#58CC02" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 10, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-3">
                                              <p className="text-sm font-extrabold text-[#3C3C3C] mb-1">
                                                {label}
                                              </p>
                                              <p className="text-sm font-bold text-[#58CC02]">
                                                {payload[0].value}m avg
                                              </p>
                                            </div>
                                          )
                                        }
                                        return null
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#58CC02"
                                      strokeWidth={3}
                                      fill="url(#colorAvgDuration)"
                                      name="Minutes"
                                    />
                                  </ComposedChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Sessions */}
                          <div className="bg-white lg:rounded-2xl lg:border-2 lg:border-[#E5E5E5] px-4 py-4 lg:p-6 lg:hover:border-[#DDF4FF] transition-colors border-b border-[#E5E5E5] lg:border-b-0">
                            <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-[#CE82FF] to-[#A855F7] rounded-lg flex items-center justify-center">
                                <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                              </div>
                              <h3 className="text-sm lg:text-base font-extrabold text-[#3C3C3C]">
                                Sessions Completed
                              </h3>
                            </div>
                            <div className="h-40 lg:h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'bar' ? (
                                  <BarChart
                                    data={chartData}
                                    margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="sessionsBarGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop offset="0%" stopColor="#CE82FF" />
                                        <stop offset="100%" stopColor="#A855F7" />
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 10, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-3">
                                              <p className="text-sm font-extrabold text-[#3C3C3C] mb-1">
                                                {label}
                                              </p>
                                              <p className="text-sm font-bold text-[#CE82FF]">
                                                {payload[0].value} sessions
                                              </p>
                                            </div>
                                          )
                                        }
                                        return null
                                      }}
                                    />
                                    <Bar
                                      dataKey="sessions"
                                      fill="url(#sessionsBarGradient)"
                                      radius={[6, 6, 6, 6]}
                                      name="Sessions"
                                    />
                                  </BarChart>
                                ) : (
                                  <ComposedChart
                                    data={chartData}
                                    margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="colorSessionsSmall"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop offset="5%" stopColor="#CE82FF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#CE82FF" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 10, fill: '#AFAFAF', fontWeight: 700 }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-3">
                                              <p className="text-sm font-extrabold text-[#3C3C3C] mb-1">
                                                {label}
                                              </p>
                                              <p className="text-sm font-bold text-[#CE82FF]">
                                                {payload[0].value} sessions
                                              </p>
                                            </div>
                                          )
                                        }
                                        return null
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="sessions"
                                      stroke="#CE82FF"
                                      strokeWidth={3}
                                      fill="url(#colorSessionsSmall)"
                                      name="Sessions"
                                    />
                                  </ComposedChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Period Stats - Duolingo Style */}
                        <div className="bg-white lg:rounded-2xl lg:border-2 lg:border-[#E5E5E5] px-4 py-4 lg:p-6 lg:hover:border-[#DDF4FF] transition-colors mt-0 lg:mt-4">
                          <h3 className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase tracking-widest mb-3 lg:mb-4">
                            This Period&apos;s Stats
                          </h3>
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                            <div className="text-center">
                              <div className="text-xl lg:text-2xl font-extrabold text-[#3C3C3C]">
                                {calculatedStats.totalHours.toFixed(1)}h
                              </div>
                              <div className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase">
                                Hours
                              </div>
                              {calculatedStats.hoursChange !== null && (
                                <div
                                  className={`text-[10px] lg:text-xs font-bold mt-1 ${calculatedStats.hoursChange >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
                                >
                                  {calculatedStats.hoursChange >= 0 ? '↑' : '↓'}{' '}
                                  {Math.abs(calculatedStats.hoursChange).toFixed(0)}%
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <div className="text-xl lg:text-2xl font-extrabold text-[#3C3C3C]">
                                {calculatedStats.avgDuration}m
                              </div>
                              <div className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase">
                                Avg Duration
                              </div>
                              {calculatedStats.avgDurationChange !== null && (
                                <div
                                  className={`text-[10px] lg:text-xs font-bold mt-1 ${calculatedStats.avgDurationChange >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
                                >
                                  {calculatedStats.avgDurationChange >= 0 ? '↑' : '↓'}{' '}
                                  {Math.abs(calculatedStats.avgDurationChange).toFixed(0)}%
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <div className="text-xl lg:text-2xl font-extrabold text-[#3C3C3C]">
                                {calculatedStats.sessions}
                              </div>
                              <div className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase">
                                Sessions
                              </div>
                              {calculatedStats.sessionsChange !== null && (
                                <div
                                  className={`text-[10px] lg:text-xs font-bold mt-1 ${calculatedStats.sessionsChange >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
                                >
                                  {calculatedStats.sessionsChange >= 0 ? '↑' : '↓'}{' '}
                                  {Math.abs(calculatedStats.sessionsChange).toFixed(0)}%
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <div className="text-xl lg:text-2xl font-extrabold text-[#3C3C3C]">
                                {calculatedStats.activeDays}
                              </div>
                              <div className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase">
                                Active Days
                              </div>
                              {calculatedStats.activeDaysChange !== null && (
                                <div
                                  className={`text-[10px] lg:text-xs font-bold mt-1 ${calculatedStats.activeDaysChange >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
                                >
                                  {calculatedStats.activeDaysChange >= 0 ? '↑' : '↓'}{' '}
                                  {Math.abs(calculatedStats.activeDaysChange).toFixed(0)}%
                                </div>
                              )}
                            </div>

                            <div className="text-center col-span-2 lg:col-span-1">
                              <div className="text-xl lg:text-2xl font-extrabold text-[#3C3C3C]">
                                {calculatedStats.activities}
                              </div>
                              <div className="text-[10px] lg:text-xs font-bold text-[#AFAFAF] uppercase">
                                Activities
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'sessions' && (
                      <div
                        className="max-w-4xl mx-auto"
                        id="sessions-panel"
                        role="tabpanel"
                        aria-labelledby="sessions-tab"
                      >
                        <Feed filters={{ type: 'user', userId: user.id }} showEndMessage={true} />
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
          </div>
        </div>

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 lg:hidden" />

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />

        {/* Footer - Desktop only */}
        <Footer />
      </div>
    </>
  )
}
