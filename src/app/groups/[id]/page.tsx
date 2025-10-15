'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import GroupInviteModal from '@/components/GroupInviteModal';
import { Group, User, GroupStats } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import Link from 'next/link';
import { Users, Settings, Activity, ChevronDown, Trophy, UserPlus } from 'lucide-react';

type GroupTab = 'leaderboard' | 'recent-activity' | 'members' | 'posts';
type TimePeriod = 'today' | 'week' | 'month' | 'year';

interface LeaderboardEntry {
  user: User;
  totalHours: number;
  sessionCount: number;
  rank: number;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GroupTab>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const groupId = params.id as string;

  useEffect(() => {
    if (groupId && user) {
      loadGroupData();
    }
  }, [groupId, user]);

  useEffect(() => {
    if (groupId && user && activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [groupId, user, timePeriod, activeTab]);

  const loadGroupData = async () => {
    try {
      setIsLoading(true);

      const groupData = await firebaseApi.group.getGroup(groupId);
      if (!groupData) {
        router.push('/groups');
        return;
      }
      setGroup(groupData);

      const stats = await firebaseApi.group.getGroupStats(groupId);
      setGroupStats(stats);

      const groupMembers = await firebaseApi.group.getGroupMembers(groupId);
      setMembers(groupMembers);

    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setIsLoadingLeaderboard(true);
      const leaderboardData = await firebaseApi.group.getGroupLeaderboard(groupId, timePeriod);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !group) return;

    try {
      await firebaseApi.group.joinGroup(group.id, user.id);
      await loadGroupData();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !group) return;

    try {
      await firebaseApi.group.leaveGroup(group.id, user.id);
      router.push('/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const getMedalOutline = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'ring-4 ring-yellow-400'; // Gold
      case 2:
        return 'ring-4 ring-gray-400'; // Silver
      case 3:
        return 'ring-4 ring-amber-600'; // Bronze
      default:
        return '';
    }
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      default:
        return 'This Week';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view groups</h1>
          <p className="text-gray-600">You need to be logged in to view group details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Group not found</h1>
            <p className="text-gray-600 mb-4">The group you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => router.push('/groups')}
              className="bg-[#007AFF] text-white px-4 py-2 rounded-lg hover:bg-[#0051D5]"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isJoined = user && group.memberIds.includes(user.id);
  const isAdmin = user && group.adminUserIds.includes(user.id);

  // Get category icon
  const getCategoryIcon = () => {
    switch (group.category) {
      case 'work':
        return '💼';
      case 'study':
        return '📚';
      case 'side-project':
        return '💻';
      case 'learning':
        return '🎓';
      default:
        return '📌';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Group Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Group Avatar */}
                <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center flex-shrink-0">
                  {group.imageUrl ? (
                    <img
                      src={group.imageUrl}
                      alt={group.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0 w-full">
                  {/* Group Name and Action Buttons */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{group.name}</h1>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => router.push(`/groups/${group.id}/settings`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Edit group"
                        >
                          <Settings className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#007AFF] hover:bg-[#0056D6] text-white rounded-lg font-medium text-sm transition-colors"
                          aria-label="Invite people"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite
                        </button>
                      </>
                    )}
                    {isJoined && !isAdmin && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#007AFF] hover:bg-[#0056D6] text-white rounded-lg font-medium text-sm transition-colors"
                        aria-label="Invite people"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </button>
                    )}
                  </div>

                  {/* Category and Location */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
                    {/* Category */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">{getCategoryIcon()}</span>
                      <span className="text-xs sm:text-sm text-gray-600 capitalize">
                        {group.category.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Location */}
                    {group.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">📍</span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {group.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {group.description && (
                    <p className="text-sm sm:text-base text-gray-700 mb-4 whitespace-pre-line max-h-24 overflow-y-auto">{group.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 -mx-4 sm:mx-0">
              <nav className="flex gap-4 sm:gap-8 overflow-x-auto px-4 sm:px-0" aria-label="Group tabs">
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'leaderboard'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Group Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('recent-activity')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'recent-activity'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Recent Activity
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'members'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'posts'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Posts
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'leaderboard' && (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Group Leaderboard</h2>

                    {/* Time Period Dropdown */}
                    <div className="relative w-full sm:w-auto">
                      <button
                        onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                        className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">{getPeriodLabel(timePeriod)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </button>

                      {showPeriodDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowPeriodDropdown(false)}
                          />
                          <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            {(['today', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                              <button
                                key={period}
                                onClick={() => {
                                  setTimePeriod(period);
                                  setShowPeriodDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                                  timePeriod === period ? 'bg-gray-100 font-medium' : ''
                                }`}
                              >
                                {getPeriodLabel(period)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {isLoadingLeaderboard ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="text-[#007AFF] hover:underline"
                        >
                          Invite people to your group
                        </button>{' '}
                        and see how you measure up.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Desktop Table Header */}
                      <div className="hidden md:grid grid-cols-[60px_1fr_100px_100px_110px_110px] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase">Rank</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase">User</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase text-right">Time</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase text-right">Sessions</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase text-right">Longest</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase text-right">Avg. Time</div>
                      </div>

                      {/* Mobile Table Header */}
                      <div className="md:hidden grid grid-cols-[50px_1fr_80px_80px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase">Rank</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase">User</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase text-right">Time</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase text-right">Sessions</div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-gray-200">
                        {leaderboard.map((entry) => {
                          const avgSessionHours = entry.sessionCount > 0 ? entry.totalHours / entry.sessionCount : 0;
                          const longestSession = entry.totalHours; // Placeholder - would need actual data from backend

                          return (
                            <Link
                              key={entry.user.id}
                              href={`/profile/${entry.user.username}`}
                              className="block hover:bg-gray-50 transition-colors"
                            >
                              {/* Desktop Layout */}
                              <div className="hidden md:grid grid-cols-[60px_1fr_100px_100px_110px_110px] gap-4 px-6 py-4 items-center">
                                {/* Rank */}
                                <div className="flex items-center justify-center">
                                  {entry.rank <= 3 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold text-gray-900">{entry.rank}</span>
                                      <Trophy
                                        className={`w-5 h-5 ${
                                          entry.rank === 1 ? 'text-yellow-400' :
                                          entry.rank === 2 ? 'text-gray-400' :
                                          'text-amber-600'
                                        }`}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-base font-semibold text-gray-900">{entry.rank}</span>
                                  )}
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Profile Picture with Medal Outline */}
                                  <div className={`flex-shrink-0 rounded-full ${getMedalOutline(entry.rank)}`}>
                                    {entry.user.profilePicture ? (
                                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white">
                                        <img
                                          src={entry.user.profilePicture}
                                          alt={entry.user.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                          {entry.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* User Name and Location */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">
                                      {entry.user.name}
                                    </div>
                                    {entry.user.location && (
                                      <div className="text-sm text-gray-500 truncate">
                                        {entry.user.location}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Total Time */}
                                <div className="text-right">
                                  <div className="text-base font-bold text-gray-900">
                                    {formatHours(entry.totalHours)}
                                  </div>
                                </div>

                                {/* Sessions */}
                                <div className="text-right">
                                  <div className="text-base font-bold text-gray-900">
                                    {entry.sessionCount}
                                  </div>
                                </div>

                                {/* Longest Session */}
                                <div className="text-right">
                                  <div className="text-base font-bold text-gray-900">
                                    {formatHours(longestSession * 0.6)}
                                  </div>
                                </div>

                                {/* Average Time */}
                                <div className="text-right">
                                  <div className="text-base font-bold text-gray-900">
                                    {formatHours(avgSessionHours)}
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Layout */}
                              <div className="md:hidden grid grid-cols-[50px_1fr_80px_80px] gap-2 px-4 py-3 items-center">
                                {/* Rank */}
                                <div className="flex items-center justify-center">
                                  {entry.rank <= 3 ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-base font-bold text-gray-900">{entry.rank}</span>
                                      <Trophy
                                        className={`w-4 h-4 ${
                                          entry.rank === 1 ? 'text-yellow-400' :
                                          entry.rank === 2 ? 'text-gray-400' :
                                          'text-amber-600'
                                        }`}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-base font-semibold text-gray-900">{entry.rank}</span>
                                  )}
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-2 min-w-0">
                                  {/* Profile Picture with Medal Outline */}
                                  <div className={`flex-shrink-0 rounded-full ${getMedalOutline(entry.rank)}`}>
                                    {entry.user.profilePicture ? (
                                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white">
                                        <img
                                          src={entry.user.profilePicture}
                                          alt={entry.user.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center">
                                        <span className="text-white font-semibold text-xs">
                                          {entry.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* User Name */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm truncate">
                                      {entry.user.name}
                                    </div>
                                  </div>
                                </div>

                                {/* Total Time */}
                                <div className="text-right">
                                  <div className="text-base font-bold text-gray-900">
                                    {formatHours(entry.totalHours)}
                                  </div>
                                </div>

                                {/* Sessions */}
                                <div className="text-right">
                                  <div className="text-base font-bold text-gray-900">
                                    {entry.sessionCount}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recent-activity' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                  <p className="text-gray-500 text-center py-12">
                    Recent group activity will be displayed here.
                  </p>
                </div>
              )}

              {activeTab === 'members' && (
                <div>
                  {/* Admins Section */}
                  {members.filter(m => group.adminUserIds.includes(m.id)).length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Admins</h2>
                      <div className="space-y-4">
                        {members
                          .filter(m => group.adminUserIds.includes(m.id))
                          .map((admin) => (
                            <div
                              key={admin.id}
                              className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0"
                            >
                              <Link
                                href={`/profile/${admin.username}`}
                                className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                              >
                                {admin.profilePicture ? (
                                  <div className="w-14 h-14 rounded-full overflow-hidden bg-white">
                                    <img
                                      src={admin.profilePicture}
                                      alt={admin.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                      {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-[#007AFF] text-lg truncate">
                                    {admin.name}
                                  </div>
                                  {admin.location && (
                                    <div className="text-sm text-gray-600 truncate">
                                      {admin.location}
                                    </div>
                                  )}
                                </div>
                              </Link>
                              {admin.id === group.createdByUserId && (
                                <span className="text-sm font-medium text-gray-600">Owner</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Members Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Members</h2>
                    {members.filter(m => !group.adminUserIds.includes(m.id)).length > 0 ? (
                      <div className="space-y-4">
                        {members
                          .filter(m => !group.adminUserIds.includes(m.id))
                          .map((member) => (
                            <Link
                              key={member.id}
                              href={`/profile/${member.username}`}
                              className="flex items-center gap-3 pb-4 border-b border-gray-200 last:border-0 hover:opacity-80 transition-opacity"
                            >
                              {member.profilePicture ? (
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-white">
                                  <img
                                    src={member.profilePicture}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#007AFF] text-lg truncate">
                                  {member.name}
                                </div>
                                {member.location && (
                                  <div className="text-sm text-gray-600 truncate">
                                    {member.location}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-900">There are no active members in this club yet.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Group Posts</h2>
                  <p className="text-gray-500 text-center py-12">
                    Group posts will be displayed here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            {/* Member Count */}
            <div
              onClick={() => setActiveTab('members')}
              className="w-full bg-white rounded-lg border border-gray-200 p-6 mb-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                </h3>
                {isJoined && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveGroup();
                    }}
                    className="text-sm text-[#007AFF] hover:underline"
                  >
                    Leave
                  </button>
                )}
              </div>

              {/* Member Avatars */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white"
                    >
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {members.length > 4 && (
                  <span className="text-sm text-[#007AFF] ml-2 hover:underline">
                    and {members.length - 4} other{members.length - 4 !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Invite People Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Invite People to This Group
              </h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full bg-[#007AFF] text-white font-medium py-2 px-4 rounded hover:bg-[#0051D5] transition-colors"
              >
                Invite People
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {group && (
        <GroupInviteModal
          group={group}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
