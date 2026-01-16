'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { firebaseApi } from '@/lib/api'

interface WeekStreakCalendarProps {
  userId: string
}

// Normalize a Date to a local YYYY-MM-DD string (avoids UTC off-by-one)
const toLocalYMD = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const WeekStreakCalendar: React.FC<WeekStreakCalendarProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set())

  // Compute this week's start and end - ending with today as the 7th node
  const { weekStart, weekEnd } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start is 6 days before today
    const start = new Date(today)
    start.setDate(today.getDate() - 6)

    // End is today
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)

    return { weekStart: start, weekEnd: end }
  }, [])

  useEffect(() => {
    const loadWeeklySessions = async () => {
      try {
        // Fetch a generous amount and filter client-side by week range
        const res = await firebaseApi.session.getSessions(100, {})

        const withinWeek = res.sessions.filter((s) => {
          const dt = new Date(s.startTime)
          return dt >= weekStart && dt <= weekEnd
        })

        const dateSet = new Set<string>()
        withinWeek.forEach((s) => {
          const localKey = toLocalYMD(new Date(s.startTime))
          dateSet.add(localKey)
        })

        setActiveDates(dateSet)
      } catch {
      } finally {
        setIsLoading(false)
      }
    }

    loadWeeklySessions()
  }, [userId, weekStart, weekEnd])

  if (isLoading) {
    return (
      <div className="flex justify-between gap-1 animate-pulse">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="h-3 bg-[#E5E5E5] rounded mb-1 w-4"></div>
            <div className="h-7 w-7 bg-[#E5E5E5] rounded-full"></div>
            <div className="h-3 bg-[#E5E5E5] rounded mt-1 w-4"></div>
          </div>
        ))}
      </div>
    )
  }

  // Build the visual model for the current week using the activeDates Set
  const getWeekDays = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = [] as Array<{
      dayOfWeek: string
      dayNumber: number
      hasActivity: boolean
      isToday: boolean
      localKey: string
      isPast: boolean
    }>

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      date.setHours(12, 0, 0, 0) // noon to avoid DST edge-cases in formatting

      const localKey = toLocalYMD(date)
      const isToday = toLocalYMD(today) === localKey
      const hasActivity = activeDates.has(localKey)

      const dayOfWeek = dayLabels[date.getDay()] || 'S'
      const dayInfo = {
        dayOfWeek,
        dayNumber: date.getDate(),
        hasActivity,
        isToday,
        localKey,
        isPast: date < today && !isToday,
      }

      days.push(dayInfo)
    }

    return days
  }

  const weekDays = getWeekDays()

  return (
    <div className="flex justify-between gap-1">
      {weekDays.map((day, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          {/* Day letter - Duolingo style bold */}
          <div
            className={`text-xs font-bold mb-1 tracking-wide ${day.isToday ? 'text-[#1CB0F6]' : 'text-[#AFAFAF]'}`}
          >
            {day.dayOfWeek}
          </div>
          {/* Circle indicator */}
          <div className="h-7 w-7 flex items-center justify-center">
            {day.hasActivity ? (
              // Completed day - orange circle with white checkmark
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center bg-[#FF9600] ${
                  day.isToday ? 'ring-2 ring-[#1CB0F6] ring-offset-2' : ''
                }`}
              >
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </div>
            ) : day.isToday ? (
              // Today (not completed) - Blue ring with light grey circle and checkmark
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#E5E5E5] ring-2 ring-[#1CB0F6] ring-offset-2">
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </div>
            ) : (
              // Past incomplete day - light grey circle with grey checkmark
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#F7F7F7]">
                <Check className="w-4 h-4 text-[#E5E5E5] stroke-[3]" />
              </div>
            )}
          </div>
          {/* Day number - Duolingo style bold */}
          <div
            className={`text-[11px] font-bold mt-1 ${day.isToday ? 'text-[#1CB0F6]' : 'text-[#AFAFAF]'}`}
          >
            {day.dayNumber}
          </div>
        </div>
      ))}
    </div>
  )
}
