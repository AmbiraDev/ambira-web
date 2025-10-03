'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { firebaseChallengeApi } from '@/lib/firebaseApi';
import { Challenge, ChallengeProgress, Group } from '@/types';
import ChallengeCard from './ChallengeCard';
import CreateChallengeModal from './CreateChallengeModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trophy, 
  Target,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';

interface GroupChallengesProps {
  group: Group;
  isAdmin: boolean;
}

export default function GroupChallenges({ group, isAdmin }: GroupChallengesProps) {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, ChallengeProgress>>({});
  const [participatingChallenges, setParticipatingChallenges] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadGroupChallenges();
  }, [group.id, activeFilter]);

  const loadGroupChallenges = async () => {
    try {
      setIsLoading(true);
      
      const filters = {
        groupId: group.id,
        status: activeFilter === 'all' ? undefined : activeFilter
      };

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
      console.error('Failed to load group challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChallenge = async (data: any) => {
    try {
      await firebaseChallengeApi.createChallenge({
        ...data,
        groupId: group.id
      });
      await loadGroupChallenges();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create challenge:', error);
      throw error;
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await firebaseChallengeApi.joinChallenge(challengeId);
      await loadGroupChallenges();
    } catch (error) {
      console.error('Failed to join challenge:', error);
      alert('Failed to join challenge. Please try again.');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      await firebaseChallengeApi.leaveChallenge(challengeId);
      await loadGroupChallenges();
    } catch (error) {
      console.error('Failed to leave challenge:', error);
      alert('Failed to leave challenge. Please try again.');
    }
  };

  const activeChallenges = challenges.filter(c => {
    const now = new Date();
    const startDate = new Date(c.startDate);
    const endDate = new Date(c.endDate);
    return now >= startDate && now <= endDate && c.isActive;
  });

  const upcomingChallenges = challenges.filter(c => {
    const now = new Date();
    const startDate = new Date(c.startDate);
    return now < startDate && c.isActive;
  });

  const completedChallenges = challenges.filter(c => {
    const now = new Date();
    const endDate = new Date(c.endDate);
    return now > endDate || !c.isActive;
  });

  const getFilteredChallenges = () => {
    switch (activeFilter) {
      case 'active':
        return activeChallenges;
      case 'upcoming':
        return upcomingChallenges;
      case 'completed':
        return completedChallenges;
      default:
        return challenges;
    }
  };

  const filteredChallenges = getFilteredChallenges();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Group Challenges</h3>
          <p className="text-sm text-gray-600">
            Compete with group members in productivity challenges
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{activeChallenges.length}</div>
          <div className="text-sm text-blue-600">Active</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{upcomingChallenges.length}</div>
          <div className="text-sm text-green-600">Upcoming</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{completedChallenges.length}</div>
          <div className="text-sm text-purple-600">Completed</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{participatingChallenges.size}</div>
          <div className="text-sm text-orange-600">Participating</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Challenges', count: challenges.length },
          { key: 'active', label: 'Active', count: activeChallenges.length },
          { key: 'upcoming', label: 'Upcoming', count: upcomingChallenges.length },
          { key: 'completed', label: 'Completed', count: completedChallenges.length }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeFilter === filter.key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
            }`}
          >
            {filter.label}
            <Badge variant="secondary" className="ml-1">
              {filter.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Challenges List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredChallenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeFilter === 'all' ? 'No challenges yet' : `No ${activeFilter} challenges`}
          </h3>
          <p className="text-gray-500 mb-6">
            {isAdmin 
              ? 'Create the first challenge for your group members to participate in.'
              : 'Check back later for new challenges to join.'
            }
          </p>
          {isAdmin && activeFilter === 'all' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Challenge
            </Button>
          )}
        </div>
      )}

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateChallenge}
        groupId={group.id}
        projects={projects}
        isLoading={false}
      />
    </div>
  );
}