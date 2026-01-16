/**
 * Mobile Feed Header Component
 *
 * Duolingo-inspired mobile header for the feed with:
 * - Avatar with level indicator and progress bar
 * - Streak flame icon with count
 * - Globe icon with following count
 * - Notification bell
 */

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useUserLevel } from '@/hooks/useUserLevel'
import { Flame, Bell, Users } from 'lucide-react'
import { firebaseApi } from '@/lib/api'
import { StreakStats } from '@/types'
import { useUnreadCount } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'

export default function MobileFeedHeader() {
  const { user } = useAuth()
  const { levelInfo, isLoading: levelLoading } = useUserLevel(user?.id)
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null)
  const [isLoadingStreak, setIsLoadingStreak] = useState(true)
  const [followingCount, setFollowingCount] = useState<number>(0)
  const unreadCount = useUnreadCount()
  const router = useRouter()

  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      // Load streak stats
      try {
        const stats = await firebaseApi.streak.getStreakStats(user.id)
        setStreakStats(stats)
      } catch {
        // Silently fail - streak is optional
      } finally {
        setIsLoadingStreak(false)
      }

      // Load following count
      try {
        const following = await firebaseApi.user.getFollowing(user.id)
        setFollowingCount(following.length)
      } catch {
        // Silently fail - following count is optional
      }
    }

    loadData()
  }, [user?.id])

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleNotificationClick = () => {
    router.push('/notifications')
  }

  // Placeholder for friends live count - can be enhanced with real-time data later
  const friendsLiveCount = 0

  return (
    <header className="lg:hidden bg-white px-4 py-4 sticky top-0 z-40 border-b border-[#E5E5E5]">
      <div className="flex items-center justify-between">
        {/* Left: Avatar with Level - wrapped in light blue container */}
        <Link
          href="/you?tab=profile"
          className="flex items-center gap-3 bg-[#DDF4FF] rounded-full pl-2 pr-6 py-2"
        >
          {/* Avatar Circle */}
          <div className="relative">
            {user.profilePicture ? (
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <Image
                  src={user.profilePicture}
                  alt={user.name}
                  width={56}
                  height={56}
                  quality={90}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 bg-[#1CB0F6] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-white font-bold text-lg">{initials}</span>
              </div>
            )}
          </div>

          {/* Level and Progress */}
          <div className="flex flex-col gap-1.5">
            <span className="text-base font-extrabold text-[#4B4B4B]">
              {levelLoading ? '...' : `Lv.${levelInfo?.level ?? 1}`}
            </span>
            {/* Progress Bar */}
            <div className="w-24 h-3 bg-[#B8E4FC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1CB0F6] rounded-full transition-all duration-300"
                style={{ width: `${levelInfo?.progressPercent ?? 0}%` }}
              />
            </div>
          </div>
        </Link>

        {/* Right: Stats Icons */}
        <div className="flex items-center gap-4">
          {/* Friends Live - with green dot indicator */}
          <Link href="/search" className="flex items-center gap-1.5 min-h-[44px]">
            <div className="relative">
              <Users className="w-8 h-8 text-[#1CB0F6]" />
              {/* Green dot indicator on bottom right */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#58CC02] rounded-full border-2 border-white" />
            </div>
            <span className="text-base font-extrabold text-[#4B4B4B]">{friendsLiveCount}</span>
          </Link>

          {/* Streak */}
          <Link href="/analytics" className="flex items-center gap-1.5 min-h-[44px]">
            <Flame
              className="w-8 h-8"
              style={{
                color:
                  streakStats && streakStats.currentStreak > 0 && !streakStats.streakAtRisk
                    ? '#FF9600'
                    : '#E5E5E5',
                fill:
                  streakStats && streakStats.currentStreak > 0 && !streakStats.streakAtRisk
                    ? '#FF9600'
                    : '#E5E5E5',
              }}
            />
            <span className="text-base font-extrabold text-[#4B4B4B]">
              {isLoadingStreak ? '...' : (streakStats?.currentStreak ?? 0)}
            </span>
          </Link>

          {/* Notifications */}
          <button
            onClick={handleNotificationClick}
            className="relative min-h-[44px] flex items-center justify-center"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          >
            <Bell className="w-8 h-8 text-[#FFAA00]" fill="#FFAA00" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-[#FF2D55] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
