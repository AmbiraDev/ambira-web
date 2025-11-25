'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { firebaseSessionApi, firebaseUserApi, firebasePostApi } from '@/lib/api'
import { User, SessionWithDetails } from '@/types'
import SessionCard from '@/features/sessions/components/SessionCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
  BarChart3,
  Trophy,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { debug } from '@/lib/debug'

export type ProfileTab = 'overview' | 'achievements' | 'followers' | 'following' | 'posts'

interface ProfileTabsProps {
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
  stats?: {
    totalHours: number
    currentStreak: number
    achievements: number
    followers: number
    following: number
    posts: number
  }
  showPrivateContent?: boolean
  userId?: string
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange, stats }) => {
  const tabs: Array<{
    id: ProfileTab
    label: string
    icon: React.ReactNode
    badge?: number
    disabled?: boolean
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      id: 'followers',
      label: 'Followers',
      icon: <Users className="w-4 h-4" />,
      badge: stats?.followers,
    },
    {
      id: 'following',
      label: 'Following',
      icon: <Users className="w-4 h-4" />,
      badge: stats?.following,
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: <FileText className="w-4 h-4" />,
      badge: stats?.posts,
    },
  ]

  return (
    <div className="border-b border-border">
      <div className="flex space-x-0 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-none border-b-2 transition-all flex-shrink-0',
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon}
            <span className="hidden md:inline whitespace-nowrap text-sm md:text-base">
              {tab.label}
            </span>
            {tab.badge !== undefined && (
              <Badge
                variant={activeTab === tab.id ? 'secondary' : 'outline'}
                className="ml-0.5 md:ml-1 text-xs px-1.5 py-0 md:inline hidden"
              >
                {tab.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Tab content components
interface TabContentProps {
  children: React.ReactNode
  className?: string
}

export const TabContent: React.FC<TabContentProps> = ({ children, className = '' }) => (
  <div className={cn('py-6', className)}>{children}</div>
)

// Overview tab content
interface OverviewContentProps {
  stats?: {
    totalHours: number
    weeklyHours: number
    monthlyHours: number
    currentStreak: number
    longestStreak: number
    sessionsThisWeek: number
    sessionsThisMonth: number
    averageSessionDuration: number
    mostProductiveHour: number
  }
}

export const OverviewContent: React.FC<OverviewContentProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  const formatHours = (hours: number | undefined): string => {
    if (hours === undefined || hours === null || isNaN(hours)) {
      return '0h'
    }
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return `${minutes}m`
    }
    return `${hours.toFixed(1)}h`
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatHours(stats.totalHours)}</div>
        </div>

        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.currentStreak} days</div>
        </div>

        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">This Week</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatHours(stats.weeklyHours)}</div>
        </div>

        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Award className="w-4 h-4" />
            <span className="text-sm">Longest Streak</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.longestStreak} days</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-4">Activity Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sessions this week:</span>
              <span className="font-medium">{stats.sessionsThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sessions this month:</span>
              <span className="font-medium">{stats.sessionsThisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg session duration:</span>
              <span className="font-medium">{formatDuration(stats.averageSessionDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Most productive hour:</span>
              <span className="font-medium">{stats.mostProductiveHour}:00</span>
            </div>
          </div>
        </div>

        <div className="bg-card-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-4">Monthly Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total hours:</span>
              <span className="font-medium">{formatHours(stats.monthlyHours)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily average:</span>
              <span className="font-medium">{formatHours(stats.monthlyHours / 30)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly average:</span>
              <span className="font-medium">{formatHours(stats.monthlyHours / 4.3)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for other tabs
export const AchievementsContent: React.FC = () => (
  <div className="text-center py-12">
    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">Achievements</h3>
    <p className="text-muted-foreground">
      Achievement system coming soon! Track your milestones and earn badges.
    </p>
  </div>
)

interface FollowListContentProps {
  userId: string
  type: 'followers' | 'following'
}

export const FollowListContent: React.FC<FollowListContentProps> = ({ userId, type }) => {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (type === 'followers') {
          const followers = await firebaseUserApi.getFollowers(userId)
          setUsers(followers)
        } else {
          const following = await firebaseUserApi.getFollowing(userId)
          setUsers(following)
        }
      } catch (err: unknown) {
        debug.error(`ProfileTabs - Failed to load ${type}:`, err)
        setError(err instanceof Error ? err.message : `Failed to load ${type}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadUsers()
    }
  }, [userId, type])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No {type === 'followers' ? 'Followers' : 'Following'}
        </h3>
        <p className="text-muted-foreground">
          {type === 'followers'
            ? 'No one is following this user yet.'
            : 'Not following anyone yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0 divide-y divide-border">
      {users.map((user) => (
        <a
          key={user.id}
          href={`/profile/${user.username}`}
          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold text-lg flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">{user.name}</div>
            <div className="text-sm text-muted-foreground">@{user.username}</div>
            {user.bio && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
            <div className="text-center">
              <div className="font-semibold text-foreground">{user.followersCount}</div>
              <div className="text-xs">followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">{user.followingCount}</div>
              <div className="text-xs">following</div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

export const FollowingContent: React.FC<{ userId: string }> = ({ userId }) => (
  <FollowListContent userId={userId} type="following" />
)

export const FollowersContent: React.FC<{ userId: string }> = ({ userId }) => (
  <FollowListContent userId={userId} type="followers" />
)

interface PostsContentProps {
  userId: string
  isOwnProfile?: boolean
}

export const PostsContent: React.FC<PostsContentProps> = ({ userId, isOwnProfile = false }) => {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [, setIsLoadingSessions] = useState(false)
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true)
        const userSessions = await firebaseSessionApi.getUserSessions(userId, 50)
        // Ensure sessions have activity field (backwards compatibility)
        const sessionsWithActivity = userSessions.map((session: SessionWithDetails) => ({
          ...session,
          activity:
            (session as SessionWithDetails & { activity?: unknown }).activity || session.project,
        }))
        setSessions(sessionsWithActivity)
      } catch (err: unknown) {
        debug.error('ProfileTabs - Failed to load sessions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load posts')
      } finally {
        setIsLoadingSessions(false)
      }
    }

    loadSessions()
  }, [userId])

  // Handle support
  const handleSupport = useCallback(async (sessionId: string) => {
    try {
      await firebasePostApi.supportSession(sessionId)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, supportCount: s.supportCount + 1, isSupported: true } : s
        )
      )
    } catch (err: unknown) {
      debug.error('ProfileTabs - Failed to support session:', err)
    }
  }, [])

  const handleRemoveSupport = useCallback(async (sessionId: string) => {
    try {
      await firebasePostApi.removeSupportFromSession(sessionId)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                supportCount: Math.max(0, s.supportCount - 1),
                isSupported: false,
              }
            : s
        )
      )
    } catch (err: unknown) {
      debug.error('ProfileTabs - Failed to remove support:', err)
    }
  }, [])

  const handleShare = useCallback(async (sessionId: string) => {
    try {
      // Share functionality - copy link to clipboard
      const shareUrl = `${window.location.origin}/sessions/${sessionId}`
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
    } catch (err: unknown) {
      debug.error('ProfileTabs - Failed to share session:', err)
    }
  }, [])

  // Handle delete
  const handleDelete = useCallback(async (sessionId: string) => {
    setDeleteConfirmSession(sessionId)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmSession) return

    try {
      setIsDeleting(true)
      await firebaseSessionApi.deleteSession(deleteConfirmSession)
      setSessions((prev) => prev.filter((session) => session.id !== deleteConfirmSession))
      setDeleteConfirmSession(null)
    } catch (err: unknown) {
      debug.error('ProfileTabs - Failed to delete session:', err)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteConfirmSession])

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error loading posts</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isOwnProfile ? 'No sessions yet' : 'No sessions'}
        </h3>
        <p className="text-muted-foreground">
          {isOwnProfile
            ? 'Complete some sessions to see them here.'
            : "This user hasn't shared any sessions yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onSupport={handleSupport}
          onRemoveSupport={handleRemoveSupport}
          onShare={handleShare}
          onDelete={isOwnProfile ? handleDelete : undefined}
          showComments={true}
        />
      ))}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmSession !== null}
        onClose={() => setDeleteConfirmSession(null)}
        onConfirm={confirmDelete}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Session"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
