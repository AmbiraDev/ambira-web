'use client';

import React, { useEffect, useState } from 'react';
import { firebaseApi } from '@/lib/firebaseApi';
import { StreakData } from '@/types';

interface StreakCalendarProps {
  userId: string;
  months?: number; // Number of months to show
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  userId,
  months = 3
}) => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const data = await firebaseApi.streak.getStreakData(userId);
        setStreakData(data);
      } catch (error) {
        console.error('Failed to load streak data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg animate-pulse"></div>
    );
  }

  if (!streakData) return null;

  // Generate calendar grid for the last N months
  const generateCalendarDays = () => {
    const today = new Date();
    const days: Array<{ date: string; hasActivity: boolean; isToday: boolean; isFuture: boolean }> = [];
    
    // Calculate start date (N months ago)
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    
    // Generate all days from start to today
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const streakDay = streakData.streakHistory.find(d => d.date === dateStr);
      
      days.push({
        date: dateStr,
        hasActivity: streakDay?.hasActivity || false,
        isToday: dateStr === today.toISOString().split('T')[0],
        isFuture: false
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const days = generateCalendarDays();
  const weeks = Math.ceil(days.length / 7);

  const getActivityColor = (hasActivity: boolean, isToday: boolean) => {
    if (isToday && !hasActivity) return 'bg-yellow-200 border-2 border-[#007AFF] ring-2 ring-[#007AFF] ring-opacity-50';
    if (isToday && hasActivity) return 'bg-green-500 border-2 border-[#007AFF] ring-2 ring-[#007AFF] ring-opacity-50 font-bold';
    if (hasActivity) return 'bg-green-500';
    return 'bg-gray-200';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Activity Calendar</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
            <span>Inactive</span>
          </div>
        </div>
      </div>
      
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dayData = days[weekIndex + dayIndex * weeks];
              if (!dayData) return <div key={dayIndex} className="w-3 h-3"></div>;
              
              return (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${getActivityColor(dayData.hasActivity, dayData.isToday)} transition-colors`}
                  title={`${dayData.date}${dayData.hasActivity ? ' - Active' : ' - No activity'}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <span className="font-semibold">{streakData.totalStreakDays}</span> total active days
        </p>
      </div>
    </div>
  );
};
