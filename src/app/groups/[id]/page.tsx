'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import GroupHeader from '@/components/GroupHeader';
import GroupTabs, { GroupTab } from '@/components/GroupTabs';
import GroupSettings from '@/components/GroupSettings';
import GroupChallenges from '@/components/GroupChallenges';
import { Group, User, GroupStats, CreateGroupData } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GroupTab>('posts');
  const [showSettings, setShowSettings] = useState(false);

  const groupId = params.id as string;

  useEffect(() => {
    if (groupId && user) {
      loadGroupData();
    }
  }, [groupId, user]);

  const loadGroupData = async () => {
    try {
      setIsLoading(true);
      
      // Load group data
      const groupData = await firebaseApi.group.getGroup(groupId);
      if (!groupData) {
        router.push('/groups');
        return;
      }
      setGroup(groupData);

      // Load group stats
      const stats = await firebaseApi.group.getGroupStats(groupId);
      setGroupStats(stats);

      // Load admin users
      const adminUsers = await Promise.all(
        groupData.adminUserIds.map(async (adminId) => {
          const userDoc = await firebaseApi.user.getUserById(adminId);
          return userDoc;
        })
      );
      setAdmins(adminUsers.filter(Boolean));

      // Load group members
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
      // Reload group data to get updated member count
      await loadGroupData();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !group) return;
    
    try {
      await firebaseApi.group.leaveGroup(group.id, user.id);
      // Redirect to groups page after leaving
      router.push('/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const handleUpdateGroup = async (data: any) => {
    if (!group) return;
    
    try {
      const updatedGroup = await firebaseApi.group.updateGroup(group.id, data);
      setGroup(updatedGroup);
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    
    try {
      await firebaseApi.group.deleteGroup(group.id);
      router.push('/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

  const handleAddAdmin = async (username: string) => {
    if (!group) return;
    
    try {
      // In a real implementation, you would search for the user by username
      // and add them as an admin. For now, this is a placeholder.
      console.log('Add admin:', username);
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!group) return;
    
    try {
      // In a real implementation, you would remove the admin role
      // For now, this is a placeholder.
      console.log('Remove admin:', userId);
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error;
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
            <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Header />
      </div>
      
      <div className="max-w-7xl mx-auto">
        {showSettings ? (
          <div className="px-4 py-6">
            <GroupSettings
              group={group}
              admins={admins}
              onUpdate={handleUpdateGroup}
              onDelete={handleDeleteGroup}
              onAddAdmin={handleAddAdmin}
              onRemoveAdmin={handleRemoveAdmin}
              isLoading={isLoading}
            />
            <div className="mt-6">
              <button 
                onClick={() => setShowSettings(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Group
              </button>
            </div>
          </div>
        ) : (
          <>
            <GroupHeader
              group={group}
              stats={groupStats}
              currentUserId={user.id}
              isJoined={isJoined}
              onJoin={handleJoinGroup}
              onLeave={handleLeaveGroup}
              onSettings={() => setShowSettings(true)}
              isLoading={isLoading}
            />

            <GroupTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              groupId={group.id}
              memberCount={group.memberCount}
              isAdmin={isAdmin}
            />

            <div className="px-4 py-6">
              {/* Tab Content */}
              {activeTab === 'posts' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Group Posts</h3>
                  <p className="text-gray-500">Group posts will be displayed here.</p>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Group Members</h3>
                  {members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members.map((member) => (
                        <Link
                          key={member.id}
                          href={`/profile/${member.username}`}
                          className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{member.name}</div>
                            <div className="text-sm text-gray-600 truncate">@{member.username}</div>
                          </div>
                          {group.adminUserIds.includes(member.id) && (
                            <span className="px-2 py-1 text-xs font-medium bg-[#007AFF] text-white rounded">Admin</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No members yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'challenges' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <GroupChallenges group={group} isAdmin={isAdmin} />
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Group Leaderboard</h3>
                  <p className="text-gray-500">Group leaderboard will be displayed here.</p>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">About This Group</h3>
                  
                  <div className="space-y-6">
                    {/* Description */}
                    {group.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-900">{group.description}</p>
                      </div>
                    )}

                    {/* Group Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Created Date */}
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-[#007AFF] mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Created</div>
                          <div className="text-gray-900">{new Date(group.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                      </div>

                      {/* Member Count */}
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-green-600 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Members</div>
                          <div className="text-gray-900">{group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}</div>
                        </div>
                      </div>

                      {/* Category */}
                      {group.category && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-purple-600 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Category</div>
                            <div className="text-gray-900 capitalize">{group.category.replace('-', ' ')}</div>
                          </div>
                        </div>
                      )}

                      {/* Type */}
                      {group.type && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-pink-600 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Type</div>
                            <div className="text-gray-900 capitalize">{group.type.replace('-', ' ')}</div>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {group.location && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-red-600 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Location</div>
                            <div className="text-gray-900">{group.location}</div>
                          </div>
                        </div>
                      )}

                      {/* Admin */}
                      {admins.length > 0 && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-indigo-600 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Admin{admins.length > 1 ? 's' : ''}</div>
                            <div className="text-gray-900">
                              {admins.map((admin, index) => (
                                <span key={admin.id}>
                                  @{admin.username}{index < admins.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    {groupStats && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Group Stats</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{groupStats.totalHours.toFixed(1)}</div>
                            <div className="text-xs text-gray-600 mt-1">Total Hours</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{groupStats.totalSessions}</div>
                            <div className="text-xs text-gray-600 mt-1">Sessions</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{groupStats.activeMembers}</div>
                            <div className="text-xs text-gray-600 mt-1">Active Members</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{groupStats.weeklyHours.toFixed(1)}</div>
                            <div className="text-xs text-gray-600 mt-1">Weekly Hours</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}