'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useActivities } from '@/hooks/useActivitiesQuery'
import { useEffect, useState, useMemo } from 'react'
import { IconRenderer } from './IconRenderer'
import { Activity } from '@/types'
import { Gift, Plus } from 'lucide-react'

interface DailyGoalProgress {
  activity: Activity
  dailyGoal: number // in hours
  currentProgress: number // in hours
  percentage: number
}

function DailyGoals() {
  const { user } = useAuth()
  const { data: activities = [] } = useActivities()
  const [goals, setGoals] = useState<DailyGoalProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create a stable key for activities to prevent infinite loops
  // Only trigger re-fetch when activity IDs change, not the array reference
  const activitiesKey = useMemo(
    () =>
      activities
        .map((a) => a.id)
        .sort()
        .join(','),
    [activities]
  )

  // Memoize activities with goals to prevent unnecessary re-renders
  const activitiesWithGoals = useMemo(
    () => activities.filter((activity) => activity.weeklyTarget && activity.weeklyTarget > 0),
    [activitiesKey] // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    const loadDailyGoals = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      if (activitiesWithGoals.length === 0) {
        setGoals([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Get today's start time (midnight)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        // Fetch today's sessions
        const { db } = await import('@/lib/firebase')
        const { collection, getDocs, query, where } = await import('firebase/firestore')

        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', user.id),
          where('startTime', '>=', todayStart)
        )

        const snapshot = await getDocs(q)

        // Calculate progress for each activity
        const progressMap = new Map<string, number>()

        snapshot.forEach((doc) => {
          const data = doc.data() as {
            activityId?: string
            projectId?: string
            duration?: number
          }
          const activityId = data.activityId || data.projectId
          if (!activityId) return

          const duration = Number(data.duration) || 0
          const currentHours = progressMap.get(activityId) || 0
          progressMap.set(activityId, currentHours + duration / 3600)
        })

        // Build daily goals array
        const dailyGoals: DailyGoalProgress[] = activitiesWithGoals.map((activity) => {
          const dailyGoal = (activity.weeklyTarget || 0) / 7
          const currentProgress = progressMap.get(activity.id) || 0
          const percentage = Math.min((currentProgress / dailyGoal) * 100, 100)

          return {
            activity,
            dailyGoal,
            currentProgress,
            percentage,
          }
        })

        setGoals(dailyGoals)
      } catch (_err) {
        setGoals([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDailyGoals()
  }, [user, activitiesWithGoals]) // Include user object to satisfy exhaustive-deps

  // Format goal text - Duolingo style (e.g., "Earn 10 XP")
  const formatGoalText = (goal: number) => {
    // If daily goal is less than 1 hour, show in minutes
    if (goal < 1) {
      const goalMin = Math.round(goal * 60)
      return `Spend ${goalMin} minutes`
    }

    // Otherwise show in hours
    const goalHrs = goal.toFixed(1)
    return `Complete ${goalHrs} hours`
  }

  // Format progress text - Duolingo style (e.g., "0 / 10")
  const formatProgressText = (current: number, goal: number) => {
    if (goal < 1) {
      const currentMin = Math.round(current * 60)
      const goalMin = Math.round(goal * 60)
      return `${currentMin} / ${goalMin}`
    }
    return `${current.toFixed(1)} / ${goal.toFixed(1)}`
  }

  // Show empty state if no goals
  if (goals.length === 0 && !isLoading) {
    return (
      <div className="p-4">
        <Link
          href="/settings/activities"
          className="flex items-center gap-3 p-3 bg-[#F7F7F7] hover:bg-[#E5E5E5] rounded-xl transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#58CC02] to-[#45A000] flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm text-[#3C3C3C]">Create Your First Quest</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <div className="w-10 h-10 bg-[#E5E5E5] rounded-xl"></div>
              <div className="flex-1">
                <div className="h-3 bg-[#E5E5E5] rounded w-28 mb-1"></div>
                <div className="h-2 bg-[#E5E5E5] rounded w-12 mb-1"></div>
                <div className="h-2 bg-[#E5E5E5] rounded-full w-full"></div>
              </div>
              <div className="w-10 h-10 bg-[#E5E5E5] rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {goals.slice(0, 3).map((goal) => {
            const isCompleted = goal.percentage >= 100

            return (
              <div
                key={goal.activity.id}
                className={`flex items-center gap-3 p-2 rounded-xl ${
                  isCompleted ? 'bg-[#E6F9E6]' : 'hover:bg-[#F7F7F7]'
                } transition-colors`}
              >
                {/* Activity Icon - Colorful like Duolingo */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-[#58CC02] to-[#45A000]'
                      : 'bg-gradient-to-br from-[#1CB0F6] to-[#0088CC]'
                  }`}
                >
                  <IconRenderer iconName={goal.activity.icon} size={20} className="text-white" />
                </div>

                {/* Progress Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-extrabold ${
                      isCompleted ? 'text-[#58CC02]' : 'text-[#4B4B4B]'
                    }`}
                  >
                    {formatGoalText(goal.dailyGoal)}
                  </p>
                  {/* Progress text like Duolingo's "0 / 10" */}
                  <p className="text-xs font-bold text-[#AFAFAF] mb-1">
                    {formatProgressText(goal.currentProgress, goal.dailyGoal)}
                  </p>
                  {/* Duolingo-style horizontal progress bar */}
                  <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isCompleted
                          ? 'bg-gradient-to-r from-[#58CC02] to-[#45A000]'
                          : 'bg-gradient-to-r from-[#FFC800] to-[#FF9600]'
                      }`}
                      style={{ width: `${Math.max(goal.percentage, 3)}%` }}
                    />
                  </div>
                </div>

                {/* Reward Icon (like Duolingo's chest) */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-gradient-to-br from-[#FFC800] to-[#FF9600]' : 'bg-[#E5E5E5]'
                  }`}
                >
                  <Gift className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-[#AFAFAF]'}`} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DailyGoals
