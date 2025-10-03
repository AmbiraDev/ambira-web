'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import GroupHeader from '@/components/GroupHeader';
import GroupTabs, { GroupTab } from '@/components/GroupTabs';
import GroupSettings from '@/components/GroupSettings';
import { Group, User, GroupStats, CreateGroupData } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
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
      <Header />
      
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Group Members</h3>
                  <p className="text-gray-500">Group members will be displayed here.</p>
                </div>
              )}

              {activeTab === 'challenges' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Group Challenges</h3>
                  <p className="text-gray-500">Group challenges will be displayed here.</p>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Group Leaderboard</h3>
                  <p className="text-gray-500">Group leaderboard will be displayed here.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}