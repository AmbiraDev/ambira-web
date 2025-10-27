'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivitiesQuery';
import { useEffect, useState } from 'react';
import { IconRenderer } from './IconRenderer';
import { Activity } from '@/types';

interface DailyGoalProgress {
  activity: Activity;
  dailyGoal: number; // in hours
  currentProgress: number; // in hours
  percentage: number;
}

function DailyGoals() {
  const { user } = useAuth();
  const { data: activities = [] } = useActivities();
  const [goals, setGoals] = useState<DailyGoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDailyGoals = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Filter activities with weekly targets
        const activitiesWithGoals = activities.filter(
          activity => activity.weeklyTarget && activity.weeklyTarget > 0
        );

        if (activitiesWithGoals.length === 0) {
          setGoals([]);
          setIsLoading(false);
          return;
        }

        // Get today's start time (midnight)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Fetch today's sessions
        const { db } = await import('@/lib/firebase');
        const { collection, getDocs, query, where } = await import(
          'firebase/firestore'
        );

        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', user.id),
          where('startTime', '>=', todayStart)
        );

        const snapshot = await getDocs(q);

        // Calculate progress for each activity
        const progressMap = new Map<string, number>();

        snapshot.forEach(doc => {
          const data = doc.data() as {
            activityId?: string;
            projectId?: string;
            duration?: number;
          };
          const activityId = data.activityId || data.projectId;
          if (!activityId) return;

          const duration = Number(data.duration) || 0;
          const currentHours = progressMap.get(activityId) || 0;
          progressMap.set(activityId, currentHours + duration / 3600);
        });

        // Build daily goals array
        const dailyGoals: DailyGoalProgress[] = activitiesWithGoals.map(
          activity => {
            const dailyGoal = (activity.weeklyTarget || 0) / 7;
            const currentProgress = progressMap.get(activity.id) || 0;
            const percentage = Math.min(
              (currentProgress / dailyGoal) * 100,
              100
            );

            return {
              activity,
              dailyGoal,
              currentProgress,
              percentage,
            };
          }
        );

        setGoals(dailyGoals);
      } catch (_err) {
        console.error('Failed to load daily goals:', err);
        setGoals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyGoals();
  }, [user, activities]);

  // Format time display
  const formatProgress = (current: number, goal: number) => {
    // If daily goal is less than 1 hour, show in minutes
    if (goal < 1) {
      const currentMin = Math.round(current * 60);
      const goalMin = Math.round(goal * 60);
      return `${currentMin} / ${goalMin} min`;
    }

    // Otherwise show in hours
    return `${current.toFixed(1)} / ${goal.toFixed(1)} hrs`;
  };

  // Show empty state if no goals
  if (goals.length === 0 && !isLoading) {
    return (
      <div className="flex justify-center mt-8 mr-4">
        <Link
          href="/activities/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#007AFF] text-white rounded-lg font-semibold text-sm hover:bg-[#0056D6] transition-colors shadow-md hover:shadow-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Your First Activity
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Today's Goals
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-[60px] h-[60px] bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2 w-28"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const radius = 26;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset =
              circumference - (goal.percentage / 100) * circumference;

            return (
              <div key={goal.activity.id} className="flex items-center gap-4">
                {/* Circular Progress Indicator */}
                <div
                  className="relative flex-shrink-0"
                  style={{ width: 60, height: 60 }}
                >
                  {/* Background circle */}
                  <svg
                    className="absolute inset-0 -rotate-90"
                    width="60"
                    height="60"
                  >
                    <circle
                      cx="30"
                      cy="30"
                      r={radius}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="4.5"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="30"
                      cy="30"
                      r={radius}
                      fill="none"
                      stroke="#007AFF"
                      strokeWidth="4.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  {/* Icon in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconRenderer
                      iconName={goal.activity.icon}
                      size={26}
                      className="text-gray-700"
                    />
                  </div>
                </div>

                {/* Activity name and percentage */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {goal.activity.name}
                    </span>
                    <span className="text-sm font-semibold flex-shrink-0 text-gray-500">
                      {Math.round(goal.percentage)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatProgress(goal.currentProgress, goal.dailyGoal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DailyGoals;
