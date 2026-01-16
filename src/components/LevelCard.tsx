/**
 * Level Card Component
 *
 * Minimalist Duolingo-inspired level display for desktop sidebar.
 */

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useUserLevel } from '@/hooks/useUserLevel'
import { getLevelTitle } from '@/lib/utils/levelCalculator'

export default function LevelCard() {
  const { user } = useAuth()
  const { levelInfo, isLoading } = useUserLevel(user?.id)

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const levelTitle = getLevelTitle(levelInfo?.level ?? 1)

  return (
    <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden hover:border-[#DDF4FF] transition-colors p-5">
      {isLoading ? (
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-14 h-14 bg-[#E5E5E5] rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-[#E5E5E5] rounded w-20"></div>
            <div className="h-3 bg-[#E5E5E5] rounded w-full"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Avatar with Level Badge */}
          <Link href="/you?tab=profile" className="relative flex-shrink-0">
            {user.profilePicture ? (
              <div className="w-14 h-14 rounded-full overflow-hidden">
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
              <div className="w-14 h-14 bg-[#1CB0F6] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">{initials}</span>
              </div>
            )}
            {/* Level Badge */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-[#FFD900] text-[#3C3C3C] text-[10px] font-extrabold w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
              {levelInfo?.level ?? 1}
            </div>
          </Link>

          {/* Level Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-lg font-extrabold text-[#4B4B4B]">
                Level {levelInfo?.level ?? 1}
              </span>
              <span className="text-sm font-bold text-[#AFAFAF]">{levelTitle}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[#E5E5E5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1CB0F6] rounded-full transition-all duration-500"
                style={{ width: `${levelInfo?.progressPercent ?? 0}%` }}
              />
            </div>

            {/* XP Info */}
            <div className="flex justify-between mt-1">
              <span className="text-xs font-bold text-[#AFAFAF]">
                {levelInfo?.totalHours ?? 0}h total
              </span>
              <span className="text-xs font-bold text-[#AFAFAF]">
                {((levelInfo?.xpForNextLevel ?? 5) - (levelInfo?.currentXP ?? 0)).toFixed(1)}h to go
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
