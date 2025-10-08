'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { UserCardCompact } from '@/components/UserCard';

interface SuggestedPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestedPeopleModal({ isOpen, onClose }: SuggestedPeopleModalProps) {
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadUsers();
    }
  }, [isOpen, user]);

  const loadUsers = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Load all users
      const { users } = await firebaseUserApi.searchUsers('', 1, 100);

      // Filter out current user and sort by followers
      const filtered = users
        .filter(u => u.id !== user.id)
        .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));

      setSuggestedUsers(filtered);
    } catch (error) {
      console.error('Error loading users:', error);
      setSuggestedUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setSuggestedUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? {
              ...u,
              isFollowing,
              followersCount: isFollowing
                ? (u.followersCount || 0) + 1
                : Math.max(0, (u.followersCount || 0) - 1)
            }
          : u
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Suggested People</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
              <p className="text-gray-600 mt-4">Loading suggestions...</p>
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No suggestions yet</h3>
              <p className="text-gray-600">Check back later for people to connect with</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestedUsers.map((suggestedUser) => (
                <div key={suggestedUser.id}>
                  <UserCardCompact
                    user={suggestedUser}
                    variant="search"
                    onFollowChange={handleFollowChange}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
