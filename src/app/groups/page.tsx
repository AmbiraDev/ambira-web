'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import BrowseGroups from '@/components/BrowseGroups';
import { Group, CreateGroupData } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGroups();
      loadUserGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const allGroups = await firebaseApi.group.searchGroups({}, 50);
      setGroups(allGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserGroups = async () => {
    if (!user) return;
    
    try {
      const userGroupsData = await firebaseApi.group.getUserGroups(user.id);
      setUserGroups(userGroupsData.map(g => g.id));
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      await firebaseApi.group.joinGroup(groupId, user.id);
      setUserGroups(prev => [...prev, groupId]);
      
      // Update group member count in local state
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, memberCount: group.memberCount + 1, memberIds: [...group.memberIds, user.id] }
          : group
      ));
    } catch (error) {
      console.error('Error joining group:', error);
      // You might want to show a toast notification here
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      await firebaseApi.group.leaveGroup(groupId, user.id);
      setUserGroups(prev => prev.filter(id => id !== groupId));
      
      // Update group member count in local state
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, memberCount: group.memberCount - 1, memberIds: group.memberIds.filter(id => id !== user.id) }
          : group
      ));
    } catch (error) {
      console.error('Error leaving group:', error);
      // You might want to show a toast notification here
    }
  };

  const handleCreateGroup = async (data: CreateGroupData) => {
    if (!user) return;
    
    try {
      const newGroup = await firebaseApi.group.createGroup(data, user.id);
      setGroups(prev => [newGroup, ...prev]);
      setUserGroups(prev => [...prev, newGroup.id]);
      
      // You might want to redirect to the new group page here
      // router.push(`/groups/${newGroup.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view groups</h1>
          <p className="text-gray-600">You need to be logged in to join and create groups.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <BrowseGroups
          groups={groups}
          userGroups={userGroups}
          onJoinGroup={handleJoinGroup}
          onLeaveGroup={handleLeaveGroup}
          onCreateGroup={handleCreateGroup}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
