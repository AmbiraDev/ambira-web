'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import {
  UserX,
  ChevronDown,
  MapPin,
  Clock,
  Target,
  Zap,
  Flame,
  Calendar,
  TrendingUp,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
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
import {
  useProfileByUsername,
  useProfileStats,
  useFollowers,
  useFollowing,
  useFollowUser,
  useUnfollowUser,
  useIsFollowing,
} from '@/features/profile/hooks'
import { useUserSessions } from '@/features/sessions/hooks'
import { useProjects } from '@/features/projects/hooks'
import Footer from '@/components/Footer'

type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y'
type ChartType = 'bar' | 'line'

interface ChartDataPoint {
  name: string
  hours: number
  sessions: number
  avgDuration: number
}

interface ProfilePageContentProps {
  username: string
}

export default function ProfilePageContent({ username }: ProfilePageContentProps) {
  const { user: currentUser } = useAuth()

  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string>('all')
  const [showActivityDropdown, setShowActivityDropdown] = useState(false)

  // Use new profile and session hooks for all data fetching
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useProfileByUsername(username)

  const isOwnProfile = currentUser?.username === username

  // Dynamic metadata using useEffect for client component
  React.useEffect(() => {
    if (profile) {
      document.title = `${profile.name} (@${profile.username}) - Focumo`

      const description = profile.bio || `View ${profile.name}'s productivity profile on Focumo`

      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', description)

      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]')
      if (!ogTitle) {
        ogTitle = document.createElement('meta')
        ogTitle.setAttribute('property', 'og:title')
        document.head.appendChild(ogTitle)
      }
      ogTitle.setAttribute('content', `${profile.name} (@${profile.username}) - Focumo`)

      let ogDescription = document.querySelector('meta[property="og:description"]')
      if (!ogDescription) {
        ogDescription = document.createElement('meta')
        ogDescription.setAttribute('property', 'og:description')
        document.head.appendChild(ogDescription)
      }
      ogDescription.setAttribute('content', description)

      let ogType = document.querySelector('meta[property="og:type"]')
      if (!ogType) {
        ogType = document.createElement('meta')
        ogType.setAttribute('property', 'og:type')
        document.head.appendChild(ogType)
      }
      ogType.setAttribute('content', 'profile')

      // Twitter card tags
      let twitterCard = document.querySelector('meta[name="twitter:card"]')
      if (!twitterCard) {
        twitterCard = document.createElement('meta')
        twitterCard.setAttribute('name', 'twitter:card')
        document.head.appendChild(twitterCard)
      }
      twitterCard.setAttribute('content', 'summary')

      let twitterTitle = document.querySelector('meta[name="twitter:title"]')
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta')
        twitterTitle.setAttribute('name', 'twitter:title')
        document.head.appendChild(twitterTitle)
      }
      twitterTitle.setAttribute('content', `${profile.name} (@${profile.username}) - Focumo`)

      let twitterDescription = document.querySelector('meta[name="twitter:description"]')
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta')
        twitterDescription.setAttribute('name', 'twitter:description')
        document.head.appendChild(twitterDescription)
      }
      twitterDescription.setAttribute('content', description)
    }
  }, [profile])

  const { data: stats, isLoading: isLoadingStats } = useProfileStats(profile?.id || '', {
    enabled: !!profile?.id,
  })

  const { data: sessions = [], isLoading: isLoadingSessions } = useUserSessions(
    profile?.id || '',
    undefined,
    {
      enabled: !!profile?.id,
    }
  )

  const { data: followers = [] } = useFollowers(profile?.id || '', {
    enabled: !!profile?.id,
  })

  const { data: following = [] } = useFollowing(profile?.id || '', {
    enabled: !!profile?.id,
  })

  const { data: activities = [] } = useProjects({
    enabled: !!profile?.id,
  })

  // Check if current user is following this profile
  const { data: isFollowing = false } = useIsFollowing(currentUser?.id || '', profile?.id || '', {
    enabled: !isOwnProfile && !!currentUser?.id && !!profile?.id,
  })

  // Use follow/unfollow mutations
  const followUserMutation = useFollowUser()
  const unfollowUserMutation = useUnfollowUser()

  // Compute loading and error states
  const isLoading = isLoadingProfile || isLoadingStats || isLoadingSessions
  const error = profileError
    ? (profileError.message as string | undefined)?.includes('not found')
      ? 'User not found'
      : (profileError.message as string | undefined)?.includes('private')
        ? 'This profile is private'
        : (profileError.message as string | undefined)?.includes('followers')
          ? 'This profile is only visible to followers'
          : 'Failed to load profile'
    : null

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

        const dayName = dayNames[day.getDay()] || 'Day'
        data.push({
          name: `${dayName.slice(0, 3)} ${day.getDate()}`,
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

        const dayName = dayNames[day.getDay()] || 'Day'
        data.push({
          name: `${dayName.slice(0, 3)} ${day.getDate()}`,
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

  // Helper to render percentage change with Duolingo style
  const renderPercentageChange = (change: number | null) => {
    if (change === null) return null

    const isPositive = change >= 0
    const formattedChange = Math.abs(change).toFixed(0)

    return (
      <div className={`text-sm font-bold ${isPositive ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>
        {isPositive ? '+' : '-'}
        {formattedChange}%
      </div>
    )
  }

  // Custom tooltip formatter with Duolingo style
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
        <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl shadow-lg p-4">
          <p className="text-sm font-extrabold text-[#3C3C3C] mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              <span>{entry.name}</span>: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Loading skeleton for profile header - Duolingo style */}
          <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-6 animate-pulse">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 bg-[#E5E5E5] rounded-full mb-4" />
              <div className="h-7 bg-[#E5E5E5] rounded-xl w-40 mb-2" />
              <div className="h-5 bg-[#E5E5E5] rounded-xl w-24 mb-4" />
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="h-6 bg-[#E5E5E5] rounded w-12 mx-auto mb-1" />
                  <div className="h-4 bg-[#E5E5E5] rounded w-16" />
                </div>
                <div className="text-center">
                  <div className="h-6 bg-[#E5E5E5] rounded w-12 mx-auto mb-1" />
                  <div className="h-4 bg-[#E5E5E5] rounded w-16" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading skeleton for stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#E5E5E5] rounded-xl" />
                  <div>
                    <div className="h-6 bg-[#E5E5E5] rounded w-16 mb-1" />
                    <div className="h-4 bg-[#E5E5E5] rounded w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF4B4B] to-[#CC0000] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserX className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#3C3C3C] mb-2">
            {error === 'User not found' && 'User Not Found'}
            {error === 'This profile is private' && 'Private Profile'}
            {error === 'This profile is only visible to followers' && 'Followers Only'}
            {error &&
              ![
                'User not found',
                'This profile is private',
                'This profile is only visible to followers',
              ].includes(error) &&
              'Error Loading Profile'}
          </h1>
          <p className="text-[#777777] font-semibold mb-6">
            {error === 'User not found' && `The user "${username}" doesn't exist.`}
            {error === 'This profile is private' &&
              `@${username}'s profile is private. Only they can view their profile.`}
            {error === 'This profile is only visible to followers' &&
              `@${username}'s profile is only visible to people they follow back.`}
            {error &&
              ![
                'User not found',
                'This profile is private',
                'This profile is only visible to followers',
              ].includes(error) &&
              'Something went wrong while loading this profile.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#58CC02] text-white font-bold rounded-2xl hover:brightness-105 transition-all border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px]"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card - Duolingo Style */}
        <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-6 mb-6 relative overflow-hidden">
          {/* Settings button for own profile */}
          {isOwnProfile && (
            <Link
              href="/settings"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-[#F7F7F7] hover:bg-[#E5E5E5] transition-colors"
            >
              <Settings className="w-5 h-5 text-[#777777]" />
            </Link>
          )}

          {/* Profile Content - Centered */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar with Gradient Ring */}
            <div className="relative mb-4">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#58CC02] to-[#45A000] p-1">
                {profile.profilePicture ? (
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    <Image
                      src={profile.profilePicture}
                      alt={`${profile.name}'s profile picture`}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF9600] to-[#FF6B00] rounded-full flex items-center justify-center border-4 border-white">
                    <span className="text-white font-extrabold text-4xl md:text-5xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Streak badge */}
              {calculatedStats.currentStreak > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#FF9600] to-[#FF6B00] rounded-full p-1.5 border-3 border-white shadow-md">
                  <Flame className="w-4 h-4 text-white" fill="white" />
                </div>
              )}
            </div>

            {/* Name and Username */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#3C3C3C] mb-1">
              {profile.name}
            </h1>
            {profile.pronouns && (
              <p className="text-[#AFAFAF] text-sm font-bold mb-1">{profile.pronouns}</p>
            )}
            <p className="text-[#777777] font-bold mb-2">@{profile.username}</p>

            {/* Tagline */}
            {profile.tagline && (
              <p className="text-[#4B4B4B] font-semibold mb-2 max-w-md">{profile.tagline}</p>
            )}

            {/* Bio */}
            {profile.bio && <p className="text-[#777777] mb-3 max-w-md text-sm">{profile.bio}</p>}

            {/* Location */}
            {profile.location && (
              <p className="text-[#AFAFAF] text-sm font-semibold mb-4 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </p>
            )}

            {/* Follow Button - Duolingo Style */}
            {!isOwnProfile && currentUser && profile && (
              <button
                onClick={async () => {
                  try {
                    if (isFollowing) {
                      await unfollowUserMutation.mutateAsync({
                        currentUserId: currentUser.id,
                        targetUserId: profile.id,
                      })
                    } else {
                      await followUserMutation.mutateAsync({
                        currentUserId: currentUser.id,
                        targetUserId: profile.id,
                      })
                    }
                  } catch {}
                }}
                disabled={followUserMutation.isPending || unfollowUserMutation.isPending}
                className={`mb-4 px-6 py-3 font-bold rounded-2xl transition-all text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed border-2 border-b-4 active:border-b-2 active:translate-y-[2px] ${
                  isFollowing
                    ? 'bg-white text-[#3C3C3C] border-[#DADADA] hover:bg-[#F7F7F7]'
                    : 'bg-[#1CB0F6] text-white border-[#0088CC] hover:brightness-105'
                }`}
              >
                {followUserMutation.isPending || unfollowUserMutation.isPending
                  ? 'Loading...'
                  : isFollowing
                    ? 'Following'
                    : 'Follow'}
              </button>
            )}

            {/* Edit Profile for own profile */}
            {isOwnProfile && (
              <Link
                href="/settings/profile"
                className="mb-4 px-6 py-3 font-bold rounded-2xl transition-all text-sm uppercase tracking-wide bg-white text-[#3C3C3C] border-2 border-b-4 border-[#DADADA] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px]"
              >
                Edit Profile
              </Link>
            )}

            {/* Follower/Following Counts */}
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-xl font-extrabold text-[#3C3C3C]">{followers.length}</div>
                <div className="text-sm font-bold text-[#AFAFAF]">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-[#3C3C3C]">{following.length}</div>
                <div className="text-sm font-bold text-[#AFAFAF]">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Duolingo Style with Gradient Icons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          {/* Total Hours */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-[#3C3C3C] truncate">
                  {calculatedStats.totalHours.toFixed(1)}h
                </div>
                <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                  Total Hours
                </div>
                {renderPercentageChange(calculatedStats.hoursChange)}
              </div>
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-[#3C3C3C] truncate">
                  {calculatedStats.sessions}
                </div>
                <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                  Sessions
                </div>
                {renderPercentageChange(calculatedStats.sessionsChange)}
              </div>
            </div>
          </div>

          {/* Avg Duration */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#CE82FF] to-[#A855F7] rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" fill="white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-[#3C3C3C] truncate">
                  {calculatedStats.avgDuration}m
                </div>
                <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                  Avg Duration
                </div>
                {renderPercentageChange(calculatedStats.avgDurationChange)}
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF9600] to-[#FF6B00] rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6 text-white" fill="white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-[#3C3C3C] truncate">
                  {calculatedStats.currentStreak}
                </div>
                <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                  Streak
                </div>
              </div>
            </div>
          </div>

          {/* Active Days */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FFD900] to-[#FFAA00] rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-[#3C3C3C] truncate">
                  {calculatedStats.activeDays}
                </div>
                <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                  Active Days
                </div>
                {renderPercentageChange(calculatedStats.activeDaysChange)}
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF4444] to-[#CC0000] rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-[#3C3C3C] truncate">
                  {calculatedStats.activities}
                </div>
                <div className="text-xs font-bold text-[#AFAFAF] uppercase tracking-wide">
                  Activities
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Charts Section */}
        <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-4 md:p-6">
          <h2 className="text-xl font-extrabold text-[#3C3C3C] mb-4">Progress</h2>

          {/* Controls */}
          <div className="space-y-3 mb-6">
            {/* Row 1: Activity Selector & Chart Type */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Activity Selector - Duolingo Style */}
              <div className="relative">
                <button
                  onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-white border-2 border-b-4 border-[#E5E5E5] rounded-xl hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all min-w-[140px]"
                >
                  <span className="truncate">
                    {selectedActivityId === 'all'
                      ? 'All Activities'
                      : activities?.find((p) => p.id === selectedActivityId)?.name ||
                        'All Activities'}
                  </span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                </button>
                {showActivityDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowActivityDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-lg border-2 border-[#E5E5E5] py-2 z-50 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedActivityId('all')
                          setShowActivityDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-[#F7F7F7] ${selectedActivityId === 'all' ? 'bg-[#DDF4FF] text-[#1CB0F6]' : 'text-[#3C3C3C]'}`}
                      >
                        All Activities
                      </button>
                      {(!activities || activities.length === 0) && (
                        <div className="px-4 py-3 text-sm text-[#AFAFAF] font-semibold">
                          No activities yet
                        </div>
                      )}
                      {activities?.map((activity) => (
                        <button
                          key={activity.id}
                          onClick={() => {
                            setSelectedActivityId(activity.id)
                            setShowActivityDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-[#F7F7F7] flex items-center gap-3 ${selectedActivityId === activity.id ? 'bg-[#DDF4FF] text-[#1CB0F6]' : 'text-[#3C3C3C]'}`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: activity.color + '20',
                            }}
                          >
                            <span style={{ color: activity.color }} className="text-lg">
                              ●
                            </span>
                          </div>
                          <span className="truncate">{activity.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Chart Type Selector - Duolingo Style */}
              <div className="relative">
                <button
                  onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-white border-2 border-b-4 border-[#E5E5E5] rounded-xl hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    {chartType === 'bar' ? (
                      <>
                        <rect x="2" y="8" width="3" height="6" rx="0.5" />
                        <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
                        <rect x="11" y="6" width="3" height="8" rx="0.5" />
                      </>
                    ) : (
                      <path
                        d="M2 12 L5 8 L8 10 L11 4 L14 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                  <span className="capitalize">{chartType}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showChartTypeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowChartTypeDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-2xl shadow-lg border-2 border-[#E5E5E5] py-2 z-50">
                      <button
                        onClick={() => {
                          setChartType('bar')
                          setShowChartTypeDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-[#F7F7F7] flex items-center gap-2 ${chartType === 'bar' ? 'bg-[#DDF4FF] text-[#1CB0F6]' : 'text-[#3C3C3C]'}`}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                          <rect x="2" y="8" width="3" height="6" rx="0.5" />
                          <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
                          <rect x="11" y="6" width="3" height="8" rx="0.5" />
                        </svg>
                        Bar
                      </button>
                      <button
                        onClick={() => {
                          setChartType('line')
                          setShowChartTypeDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-[#F7F7F7] flex items-center gap-2 ${chartType === 'line' ? 'bg-[#DDF4FF] text-[#1CB0F6]' : 'text-[#3C3C3C]'}`}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M2 12 L5 8 L8 10 L11 4 L14 6"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Line
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Time Period Buttons - Duolingo Style */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
              {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`flex-shrink-0 px-5 py-2.5 text-sm font-bold rounded-xl transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[2px] ${
                    timePeriod === period
                      ? 'bg-[#58CC02] text-white border-[#45A000]'
                      : 'bg-white text-[#3C3C3C] border-[#E5E5E5] hover:bg-[#F7F7F7]'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Main Chart - Hours Completed */}
          <div className="bg-[#F7F7F7] rounded-2xl p-4 mb-4">
            <h3 className="font-extrabold text-[#3C3C3C] mb-4">Hours Completed</h3>
            <div className="h-64">
              {isLoading ? (
                <div className="h-full bg-[#E5E5E5] rounded-xl animate-pulse" />
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
                        tick={{ fontSize: 12, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="hours" fill="#1CB0F6" radius={[8, 8, 0, 0]} name="Hours" />
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
                          <stop offset="5%" stopColor="#1CB0F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1CB0F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
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

          {/* Two Smaller Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Average Session Duration */}
            <div className="bg-[#F7F7F7] rounded-2xl p-4">
              <h3 className="font-extrabold text-[#3C3C3C] mb-4">Avg Session Duration</h3>
              <div className="h-44">
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
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#58CC02" radius={[6, 6, 0, 0]} name="Minutes" />
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
                          <stop offset="5%" stopColor="#58CC02" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#58CC02" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
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

            {/* Sessions Completed */}
            <div className="bg-[#F7F7F7] rounded-2xl p-4">
              <h3 className="font-extrabold text-[#3C3C3C] mb-4">Sessions Completed</h3>
              <div className="h-44">
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
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="sessions"
                        fill="#CE82FF"
                        radius={[6, 6, 0, 0]}
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
                          <stop offset="5%" stopColor="#CE82FF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#CE82FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#777777', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
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
        </div>
      </div>

      {/* Footer - Desktop only */}
      <Footer />
    </div>
  )
}
