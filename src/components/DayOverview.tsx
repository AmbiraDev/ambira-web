'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseSessionApi, firebaseUserApi } from '@/lib/firebaseApi';
import { Clock, Flame, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DayOverview() {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState({
    totalTime: 0,
    sessionsCount: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTodayStats();
    }
  }, [user]);

  const loadTodayStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get today's sessions
      const sessions = await firebaseSessionApi.getUserSessions(user.id, 50, true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySessions = sessions.filter(session => {
        const sessionDate = session.startTime instanceof Date 
          ? session.startTime 
          : new Date(session.startTime);
        const sessionDay = new Date(sessionDate);
        sessionDay.setHours(0, 0, 0, 0);
        return sessionDay.getTime() === today.getTime();
      });

      // Calculate total time
      const totalSeconds = todaySessions.reduce((sum, session) => sum + session.duration, 0);
      
      // Get streak
      const stats = await firebaseUserApi.getUserStats(user.id);
      
      setTodayStats({
        totalTime: totalSeconds,
        sessionsCount: todaySessions.length,
        currentStreak: stats?.currentStreak || 0,
      });
    } catch (error) {
      console.error('Failed to load today stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="animate-pulse flex gap-3">
          <div className="h-16 bg-gray-200 rounded-lg flex-1"></div>
          <div className="h-16 bg-gray-200 rounded-lg flex-1"></div>
          <div className="h-16 bg-gray-200 rounded-lg flex-1"></div>
        </div>
      </div>
    );
  }

  return (
    <Link href="/you?tab=progress" className="md:hidden block bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Today's Progress</h3>
        <TrendingUp className="w-4 h-4 text-blue-600" />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Total Time */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <Clock className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-lg font-bold text-gray-900">
            {formatTime(todayStats.totalTime)}
          </div>
          <div className="text-xs text-gray-500">Time</div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <Target className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-lg font-bold text-gray-900">
            {todayStats.sessionsCount}
          </div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <Flame className="w-5 h-5 text-orange-600 mb-2" />
          <div className="text-lg font-bold text-gray-900">
            {todayStats.currentStreak}
          </div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>
      </div>
    </Link>
  );
}
