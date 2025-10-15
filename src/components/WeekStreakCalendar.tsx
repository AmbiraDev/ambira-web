'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { firebaseApi } from '@/lib/firebaseApi';

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

export const WeekStreakCalendar: React.FC<WeekStreakCalendarProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());

  // Compute this week's start (Sun 00:00) and end (Sat 23:59:59.999) in local time
  const { weekStart, weekEnd } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(today.getDate() - today.getDay()); // Sunday

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    end.setHours(23, 59, 59, 999);

    return { weekStart: start, weekEnd: end };
  }, []);

  useEffect(() => {
    const loadWeeklySessions = async () => {
      try {
        // Fetch a generous amount and filter client-side by week range
        const res = await firebaseApi.session.getSessions(1, 100, {} as any);

        const withinWeek = res.sessions.filter((s) => {
          const dt = new Date(s.startTime);
          return dt >= weekStart && dt <= weekEnd;
        });


        const dateSet = new Set<string>();
        withinWeek.forEach((s) => {
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
      <div className="flex justify-between animate-pulse">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="h-3 bg-gray-200 rounded mb-1 mx-auto w-4"></div>
            <div className="h-8 bg-gray-200 rounded mx-auto w-8"></div>
          </div>
        ))}
      </div>
    );
  }

  // Build the visual model for the current week using the activeDates Set
  const getWeekDays = () => {
    const today = new Date();
    const days = [] as Array<{
      dayOfWeek: string;
      dayNumber: number;
      hasActivity: boolean;
      isToday: boolean;
      localKey: string;
      isPast: boolean;
    }>;


    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      date.setHours(12, 0, 0, 0); // noon to avoid DST edge-cases in formatting

      const localKey = toLocalYMD(date);
      const isToday = toLocalYMD(today) === localKey;
      const hasActivity = activeDates.has(localKey);

      const dayInfo = {
        dayOfWeek: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
        dayNumber: date.getDate(),
        hasActivity,
        isToday,
        localKey,
        isPast: date < today && !isToday
      };

      days.push(dayInfo);
    }

    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="flex justify-between">
      {weekDays.map((day, index) => (
        <div key={index} className="flex-1 text-center">
          <div className="text-xs text-gray-500 mb-1">{day.dayOfWeek}</div>
          <div className="h-8 flex items-center justify-center">
            {day.hasActivity ? (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                day.isToday 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-[#007AFF] text-white'
              }`}>
                <span className="text-sm font-semibold">{day.dayNumber}</span>
              </div>
            ) : (
              <span className={`text-sm font-semibold ${
                day.isPast ? 'text-gray-300' : 'text-gray-400'
              }`}>
                {day.dayNumber}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
