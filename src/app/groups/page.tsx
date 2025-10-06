'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import CreateGroupModal from '@/components/CreateGroupModal';
import { Group, Challenge } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import { Users, Trophy, Target, Calendar, Award, Dumbbell, Book, Briefcase, Heart, Plus } from 'lucide-react';
import Link from 'next/link';

type TabType = 'active' | 'challenges' | 'create';

const categoryIcons: Record<string, React.ReactNode> = {
  fitness: <Dumbbell className="w-5 h-5" />,
  study: <Book className="w-5 h-5" />,
  work: <Briefcase className="w-5 h-5" />,
  health: <Heart className="w-5 h-5" />,
  default: <Target className="w-5 h-5" />,
};

export default function GroupsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [groups, setGroups] = useState<Group[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load user's groups
      const userGroupsData = await firebaseApi.group.getUserGroups(user.id);
      setGroups(userGroupsData);

      // Load all challenges
      const allChallenges = await firebaseApi.challenge.searchChallenges({}, 50);
      setChallenges(allChallenges);

      // Get user's active challenges
      const userActiveChallenges = await firebaseApi.challenge.getUserChallenges(user.id);
      setUserChallenges(userActiveChallenges.map(c => c.id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      await firebaseApi.challenge.joinChallenge(challengeId);
      setUserChallenges(prev => [...prev, challengeId]);
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const handleCreateGroup = async (data: any) => {
    if (!user) return;

    try {
      await firebaseApi.group.createGroup({
        ...data,
        creatorId: user.id,
      });
      await loadData();
      setActiveTab('active');
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view groups</h1>
          <p className="text-gray-600">You need to be logged in to join groups and challenges.</p>
        </div>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => userChallenges.includes(c.id));
  const availableChallenges = challenges.filter(c => !userChallenges.includes(c.id));

  // Group challenges by category
  const challengesByCategory = availableChallenges.reduce((acc, challenge) => {
    const category = challenge.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(challenge);
    return acc;
  }, {} as Record<string, Challenge[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="Groups" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Tabs */}
        <div className="sticky top-14 md:top-0 bg-white md:bg-gray-50  z-30">
          <div className="bg-gray-50 border-b md:border-b-0 border-gray-200">
            <div className="max-w-4xl mx-auto flex gap-8 px-4 md:px-6 lg:px-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium transition-colors border-b-2 ${
                  activeTab === 'active'
                    ? 'text-[#007AFF] md:text-gray-900 border-[#007AFF]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium transition-colors border-b-2 ${
                  activeTab === 'challenges'
                    ? 'text-[#007AFF] md:text-gray-900 border-[#007AFF]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Challenges
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium transition-colors border-b-2 flex items-center justify-center gap-1 ${
                  activeTab === 'create'
                    ? 'text-[#007AFF] md:text-gray-900 border-[#007AFF]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Plus className="w-4 h-4 md:hidden" />
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto py-6">
          {activeTab === 'create' ? (
            // Create Group Form
            <CreateGroupModal
              isOpen={true}
              isFullPage={true}
              onClose={() => setActiveTab('active')}
              onSubmit={handleCreateGroup}
            />
          ) : activeTab === 'active' ? (
            // Active Groups Tab
            <div>
              {isLoading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
                </div>
              ) : groups.length > 0 ? (
                <div className="grid gap-3 md:gap-4">
                  {groups.map(group => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="group block bg-white rounded-xl border border-gray-100 hover:border-[#007AFF]/30 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="p-4 md:p-5">
                        <div className="flex items-start gap-3 md:gap-4">
                          {/* Group Icon/Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-2xl flex items-center justify-center shadow-sm">
                              <Users className="w-7 h-7 md:w-8 md:h-8 text-white" />
                            </div>
                            {/* Member count badge */}
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-0.5 shadow-sm border border-gray-100">
                              <span className="text-xs font-semibold text-gray-700">{group.memberCount}</span>
                            </div>
                          </div>

                          {/* Group Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <h3 className="font-semibold text-base md:text-lg text-gray-900 group-hover:text-[#007AFF] transition-colors">
                                {group.name}
                              </h3>
                              {/* Privacy indicator */}
                              <div className="flex-shrink-0">
                                <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                                  group.privacy === 'public'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-orange-50 text-orange-700'
                                }`}>
                                  {group.privacy === 'public' ? 'Public' : 'Private'}
                                </div>
                              </div>
                            </div>

                            {group.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {group.description}
                              </p>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                              </span>
                              {group.category && (
                                <span className="flex items-center gap-1">
                                  <Target className="w-3.5 h-3.5" />
                                  <span className="capitalize">{group.category}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 md:py-20">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-6 max-w-sm mx-auto">
                    Join a group to track productivity with friends and compete in challenges
                  </p>
                  <Link
                    href="/search?type=groups"
                    className="inline-flex items-center px-5 py-2.5 bg-[#007AFF] text-white text-sm font-medium rounded-xl hover:bg-[#0051D5] transition-colors shadow-sm"
                  >
                    Discover Groups
                  </Link>
                </div>
              )}
            </div>
          ) : (
            // Challenges Tab
            <div className="space-y-6">
              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Your Active Challenges</h2>
                  <div className="space-y-3">
                    {activeChallenges.map(challenge => (
                      <Link
                        key={challenge.id}
                        href={`/challenges/${challenge.id}`}
                        className="block bg-white rounded-lg border border-[#007AFF] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#007AFF] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">{challenge.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{challenge.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {challenge.participantCount} participants
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Ends {new Date(challenge.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Challenges by Category */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {activeChallenges.length > 0 ? 'Discover More Challenges' : 'Available Challenges'}
                </h2>

                {Object.keys(challengesByCategory).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(challengesByCategory).map(([category, categoryChallenges]) => (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 text-[#007AFF]">
                            {categoryIcons[category.toLowerCase()] || categoryIcons.default}
                          </div>
                          <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                        </div>
                        <div className="space-y-3">
                          {categoryChallenges.map(challenge => (
                            <div
                              key={challenge.id}
                              className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 mb-1">{challenge.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{challenge.description}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {challenge.participantCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      Ends {new Date(challenge.endDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleJoinChallenge(challenge.id)}
                                  className="px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg hover:bg-[#0051D5] transition-colors flex-shrink-0"
                                >
                                  Join
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Challenges Available</h3>
                    <p className="text-gray-600">Check back later for new challenges</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
