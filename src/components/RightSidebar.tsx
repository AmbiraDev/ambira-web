'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseChallengeApi } from '@/lib/firebaseApi';
import { Challenge, ChallengeProgress as ChallengeProgressType } from '@/types';
import ChallengeProgress from './ChallengeProgress';
import { Trophy, Target } from 'lucide-react';

function RightSidebar() {
  const { user } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, ChallengeProgressType>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadActiveChallenges();
    }
  }, [user]);

  const loadActiveChallenges = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      if (!user) {
        console.log('User not authenticated, skipping challenges load');
        return;
      }
      
      // First try to load all active challenges, then filter by participation
      // This avoids complex queries that might fail
      let challenges = await firebaseChallengeApi.getChallenges({
        status: 'active'
      });
      
      // If that fails, try without any filters
      if (challenges.length === 0) {
        try {
          const allChallenges = await firebaseChallengeApi.getChallenges({});
          // Filter client-side for active challenges
          const now = new Date();
          challenges = allChallenges.filter(challenge => {
            const startDate = new Date(challenge.startDate);
            const endDate = new Date(challenge.endDate);
            return now >= startDate && now <= endDate && challenge.isActive;
          });
        } catch (fallbackError) {
          console.warn('Fallback challenges query also failed:', fallbackError);
          challenges = [];
        }
      }
      
      // Filter for challenges the user is participating in
      const participatingChallenges = [];
      for (const challenge of challenges) {
        try {
          const progress = await firebaseChallengeApi.getChallengeProgress(challenge.id);
          if (progress) {
            participatingChallenges.push(challenge);
          }
        } catch (progressError) {
          // Skip challenges we can't check participation for
          continue;
        }
      }
      
      challenges = participatingChallenges;
      
      setActiveChallenges(challenges.slice(0, 3)); // Show top 3

      // Load progress for each challenge
      const progressMap: Record<string, ChallengeProgressType> = {};
      for (const challenge of challenges.slice(0, 3)) {
        try {
          const progress = await firebaseChallengeApi.getChallengeProgress(challenge.id);
          if (progress) {
            progressMap[challenge.id] = progress;
          }
        } catch (progressError) {
          console.warn(`Failed to load progress for challenge ${challenge.id}:`, progressError);
        }
      }
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Failed to load active challenges:', error);
      // Don't show error to user, just log it
      setActiveChallenges([]);
      setUserProgress({});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-[60px] space-y-6">
        {/* Active Challenges */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-gray-900" />
              <h3 className="text-lg font-bold text-gray-900">Active Challenges</h3>
            </div>
            <Link 
              href="/challenges"
              className="text-sm font-medium text-[#007AFF] hover:text-[#0056D6] transition-colors"
            >
              View All
            </Link>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activeChallenges.length > 0 ? (
            <div className="space-y-4">
              {activeChallenges.map((challenge) => (
                <ChallengeProgress
                  key={challenge.id}
                  challenge={challenge}
                  progress={userProgress[challenge.id]}
                  compact={true}
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                No active challenges yet
              </p>
              <Link 
                href="/challenges"
                className="text-sm font-medium text-[#007AFF] hover:text-[#0056D6] transition-colors"
              >
                Browse Challenges
              </Link>
            </div>
          )}
        </div>

        {/* Clubs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Clubs</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Why do it alone? Get more out of your Ambira experience by joining or creating a Club.
          </p>
          <button className="text-sm font-medium text-[#007AFF] hover:text-[#0056D6] transition-colors">
            View All Clubs
          </button>
        </div>

        {/* Suggested Friends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Suggested Friends</h3>
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">No suggestions yet</h4>
            <p className="text-xs text-gray-600 mb-4">
              We'll suggest users to follow based on your activity and interests.
            </p>
            <button className="text-sm font-medium text-[#007AFF] hover:text-[#0056D6] transition-colors">
              Browse All Users
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-gray-600">
            <a href="#" className="hover:text-[#007AFF]">Community Hub</a>
            <a href="#" className="hover:text-[#007AFF]">Support</a>
            <a href="#" className="hover:text-[#007AFF]">Subscription</a>
            <a href="#" className="hover:text-[#007AFF]">Student Discount</a>
            <a href="#" className="hover:text-[#007AFF]">Teacher, Military & Medical Discount (US Only)</a>
            <a href="#" className="hover:text-[#007AFF]">Terms</a>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
