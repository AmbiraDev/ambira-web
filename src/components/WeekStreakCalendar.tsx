'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { firebaseApi } from '@/lib/api';

interface WeekStreakCalendarProps {
  userId: string;
}

// Normalize a Date to a local YYYY-MM-DD string (avoids UTC off-by-one)
const toLocalYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const WeekStreakCalendar: React.FC<WeekStreakCalendarProps> = ({
  userId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());

  // Compute this week's start and end - ending with today as the 7th node
  const { weekStart, weekEnd } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start is 6 days before today
    const start = new Date(today);
    start.setDate(today.getDate() - 6);

    // End is today
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    return { weekStart: start, weekEnd: end };
  }, []);

  useEffect(() => {
    const loadWeeklySessions = async () => {
      try {
        // Fetch a generous amount and filter client-side by week range
        const res = await firebaseApi.session.getSessions(1, 100, {} as any);

        const withinWeek = res.sessions.filter(s => {
          const dt = new Date(s.startTime);
          return dt >= weekStart && dt <= weekEnd;
        });

        const dateSet = new Set<string>();
        withinWeek.forEach(s => {
          const localKey = toLocalYMD(new Date(s.startTime));
          dateSet.add(localKey);
        });

        setActiveDates(dateSet);
      } catch (error) {
        console.error('❌ Failed to load sessions for week:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeeklySessions();
  }, [userId, weekStart, weekEnd]);

  if (isLoading) {
    return (
      <div className="flex justify-between gap-0.5 animate-pulse">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="h-3 bg-gray-200 rounded mb-1.5 w-4"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Build the visual model for the current week using the activeDates Set
  const getWeekDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [] as Array<{
      dayOfWeek: string;
      dayNumber: number;
      hasActivity: boolean;
      isToday: boolean;
      localKey: string;
      isPast: boolean;
    }>;

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      date.setHours(12, 0, 0, 0); // noon to avoid DST edge-cases in formatting

      const localKey = toLocalYMD(date);
      const isToday = toLocalYMD(today) === localKey;
      const hasActivity = activeDates.has(localKey);

      const dayOfWeek = dayLabels[date.getDay()] || 'S';
      const dayInfo = {
        dayOfWeek,
        dayNumber: date.getDate(),
        hasActivity,
        isToday,
        localKey,
        isPast: date < today && !isToday,
      };

      days.push(dayInfo);
    }

    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="flex justify-between gap-0.5">
      {weekDays.map((day, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className={`text-xs font-medium mb-1.5 ${day.isToday ? 'text-[#007AFF] font-bold' : 'text-gray-400'}`}
          >
            {day.dayOfWeek}
          </div>
          <div className="h-6 w-6 flex items-center justify-center">
            {day.hasActivity ? (
              // Completed day - orange circle with white checkmark
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center bg-orange-400 ${
                  day.isToday ? 'ring-2 ring-[#007AFF] ring-offset-1' : ''
                }`}
              >
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
            ) : day.isToday ? (
              // Today (not completed) - Electric Blue ring with grey circle and white checkmark
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-300 ring-2 ring-[#007AFF] ring-offset-1">
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
            ) : (
              // Past incomplete day - light grey circle with grey checkmark
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
                <Check className="w-3.5 h-3.5 text-gray-300 stroke-[3]" />
              </div>
            )}
          </div>
          <div
            className={`text-[10px] font-medium mt-0.5 ${day.isToday ? 'text-[#007AFF] font-bold' : 'text-gray-500'}`}
          >
            {day.dayNumber}
          </div>
        </div>
      ))}
    </div>
  );
};
