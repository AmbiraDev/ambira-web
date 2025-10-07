'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseChallengeApi } from '@/lib/firebaseApi';
import { Challenge, ChallengeFilters, ChallengeProgress } from '@/types';
import Header from '@/components/HeaderComponent';
import ChallengeCard from '@/components/ChallengeCard';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  Search,
  TrendingUp,
  Zap,
  Timer
} from 'lucide-react';

const filterTabs = [
  { key: 'all', label: 'All Challenges', icon: Trophy },
  { key: 'active', label: 'Active', icon: TrendingUp },
  { key: 'upcoming', label: 'Upcoming', icon: Target },
  { key: 'participating', label: 'My Challenges', icon: Target }
];

const challengeTypeFilters = [
  { key: 'most-activity', label: 'Most Activity', icon: TrendingUp },
  { key: 'fastest-effort', label: 'Fastest Effort', icon: Zap },
  { key: 'longest-session', label: 'Longest Session', icon: Timer },
  { key: 'group-goal', label: 'Group Goal', icon: Target }
];

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, ChallengeProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'upcoming' | 'participating'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [participatingChallenges, setParticipatingChallenges] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadChallenges();
  }, [activeFilter, typeFilter]);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      
      const filters: ChallengeFilters = {};
      
      if (activeFilter === 'active') {
        filters.status = 'active';
      } else if (activeFilter === 'upcoming') {
        filters.status = 'upcoming';
      } else if (activeFilter === 'participating') {
        filters.isParticipating = true;
      }
      
      if (typeFilter !== 'all') {
        filters.type = typeFilter as any;
      }

      const challengesList = await firebaseChallengeApi.getChallenges(filters);
      setChallenges(challengesList);

      // Load user progress for participating challenges
      if (user) {
        const progressMap: Record<string, ChallengeProgress> = {};
        const participatingSet = new Set<string>();
        
        for (const challenge of challengesList) {
          const progress = await firebaseChallengeApi.getChallengeProgress(challenge.id);
          if (progress) {
            progressMap[challenge.id] = progress;
            participatingSet.add(challenge.id);
          }
        }
        
        setUserProgress(progressMap);
        setParticipatingChallenges(participatingSet);
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await firebaseChallengeApi.joinChallenge(challengeId);
      await loadChallenges(); // Reload to update participation status
    } catch (error) {
      console.error('Failed to join challenge:', error);
      alert('Failed to join challenge. Please try again.');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      await firebaseChallengeApi.leaveChallenge(challengeId);
      await loadChallenges(); // Reload to update participation status
    } catch (error) {
      console.error('Failed to leave challenge:', error);
      alert('Failed to leave challenge. Please try again.');
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return challenge.name.toLowerCase().includes(query) ||
             challenge.description.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenges</h1>
          <p className="text-gray-600">
            Participate in productivity challenges and compete with others
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search and Type Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {challengeTypeFilters.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isParticipating={participatingChallenges.has(challenge.id)}
                userProgress={userProgress[challenge.id]?.currentValue || 0}
                onJoin={() => handleJoinChallenge(challenge.id)}
                onLeave={() => handleLeaveChallenge(challenge.id)}
                showActions={!!user}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No challenges found' : 'No challenges available'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Check back later for new challenges to join'
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
