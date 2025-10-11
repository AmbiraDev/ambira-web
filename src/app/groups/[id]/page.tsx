'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import { Group, User, GroupStats } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import Link from 'next/link';
import { Users, Settings, Activity } from 'lucide-react';

type GroupTab = 'leaderboard' | 'recent-activity' | 'members' | 'posts';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GroupTab>('leaderboard');

  const groupId = params.id as string;

  useEffect(() => {
    if (groupId && user) {
      loadGroupData();
    }
  }, [groupId, user]);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Group Header */}
            <div className="mb-6">
              <div className="flex items-start gap-4">
                {/* Group Avatar */}
                <div className="w-32 h-32 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center flex-shrink-0">
                  {group.imageUrl ? (
                    <img
                      src={group.imageUrl}
                      alt={group.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-16 h-16 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Group Name and Edit Icon */}
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                    {isAdmin && (
                      <button
                        onClick={() => router.push(`/groups/${group.id}/settings`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Edit group"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Category and Location */}
                  <div className="flex items-center gap-4 mb-3">
                    {/* Category */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon()}</span>
                      <span className="text-sm text-gray-600 capitalize">
                        {group.category.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Location */}
                    {group.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <span className="text-sm text-gray-600">
                          {group.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {group.description && (
                    <p className="text-gray-700 mb-4 whitespace-pre-line max-h-24 overflow-y-auto">{group.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex gap-8" aria-label="Group tabs">
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'leaderboard'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Group Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('recent-activity')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'recent-activity'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Recent Activity
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'members'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {activeTab === 'leaderboard' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Group Leaderboard</h2>
                  <p className="text-gray-600 mb-6">
                    Compare your training with other Group members and stay motivated throughout the week.
                  </p>
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      <Link href="#" className="text-[#007AFF] hover:underline">
                        Invite people to your group
                      </Link>{' '}
                      and see how you measure up.
                    </p>
                  </div>
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
                                  <img
                                    src={admin.profilePicture}
                                    alt={admin.name}
                                    className="w-14 h-14 rounded-full object-cover"
                                  />
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
                                <img
                                  src={member.profilePicture}
                                  alt={member.name}
                                  className="w-14 h-14 rounded-full object-cover"
                                />
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
            <button
              onClick={() => setActiveTab('members')}
              className="w-full bg-white rounded-lg border border-gray-200 p-6 mb-6 text-left hover:bg-gray-50 transition-colors"
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
                      className="w-12 h-12 rounded-full border-2 border-white overflow-hidden"
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
            </button>

            {/* Invite People Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Invite People to This Group
              </h3>
              <button className="w-full bg-[#007AFF] text-white font-medium py-2 px-4 rounded hover:bg-[#0051D5] transition-colors">
                Invite People
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
