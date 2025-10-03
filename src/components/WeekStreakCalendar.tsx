'use client';

import React, { useEffect, useState } from 'react';
import { firebaseApi } from '@/lib/firebaseApi';
import { StreakData } from '@/types';

interface WeekStreakCalendarProps {
  userId: string;
}

export const WeekStreakCalendar: React.FC<WeekStreakCalendarProps> = ({ userId }) => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const data = await firebaseApi.streak.getStreakData(userId);
        console.log('📊 Streak Data Loaded:', data);
        console.log('📅 Streak History:', data?.streakHistory);
        setStreakData(data);
      } catch (error) {
        console.error('❌ Failed to load streak data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [userId]);

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

  // Get the current week (Sunday to Saturday)
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate the start of the week (Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    
    const days = [];
    console.log('🗓️ Generating week days...');
    console.log('📍 Today:', today.toISOString().split('T')[0]);
    console.log('📍 Week Start:', weekStart.toISOString().split('T')[0]);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const streakDay = streakData?.streakHistory.find(d => d.date === dateStr);
      const isToday = dateStr === today.toISOString().split('T')[0];
      
      const dayInfo = {
        dayOfWeek: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
        dayNumber: date.getDate(),
        hasActivity: streakDay?.hasActivity || false,
        isToday,
        isPast: date < today && !isToday
      };
      
      console.log(`📅 ${dayInfo.dayOfWeek} ${dayInfo.dayNumber}:`, {
        dateStr,
        hasActivity: dayInfo.hasActivity,
        isToday: dayInfo.isToday,
        streakDay
      });
      
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
