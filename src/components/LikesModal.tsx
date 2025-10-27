'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { User } from '@/types';
import { firebaseApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userIds: string[];
  totalLikes: number;
}

interface UserWithFollowStatus extends User {
  isFollowing?: boolean;
}

export const LikesModal: React.FC<LikesModalProps> = ({
  isOpen,
  onClose,
  userIds,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithFollowStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<
    Record<string, boolean>
  >({});

  // Extract complex expression to separate variable
  const userIdsKey = userIds.join(',');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch user data for each user ID
      const userPromises = userIds.map(userId =>
        firebaseApi.user.getUserById(userId).catch(() => null)
      );
      const loadedUsers = await Promise.all(userPromises);
      const validUsers = loadedUsers.filter((u): u is User => u !== null);

      // Check follow status for each user
      if (currentUser) {
        const followStatuses: Record<string, boolean> = {};
        await Promise.all(
          validUsers.map(async user => {
            try {
              const isFollowing = await firebaseApi.user.isFollowing(
                currentUser.id,
                user.id
              );
              followStatuses[user.id] = isFollowing;
            } catch {
              followStatuses[user.id] = false;
            }
          })
        );
        setFollowingStates(followStatuses);
      }

      setUsers(validUsers);
    } catch (_error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdsKey, currentUser]);

  useEffect(() => {
    if (isOpen && userIds.length > 0) {
      loadUsers();
    } else if (!isOpen) {
      // Reset state when modal closes
      setUsers([]);
      setFollowingStates({});
    }
  }, [isOpen, userIdsKey, userIds.length, loadUsers]); // Include all dependencies

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleFollowToggle = async (userId: string) => {
    if (!currentUser) return;

    const isCurrentlyFollowing = followingStates[userId] || false;

    // Optimistic update
    setFollowingStates(prev => ({
      ...prev,
      [userId]: !isCurrentlyFollowing,
    }));

    try {
      if (isCurrentlyFollowing) {
        await firebaseApi.user.unfollowUser(userId);
      } else {
        await firebaseApi.user.followUser(userId);
      }
    } catch (_error) {
      console.error('Failed to toggle follow:', error);
      // Revert on error
      setFollowingStates(prev => {
        const newState: Record<string, boolean> = { ...prev };
        newState[userId] = isCurrentlyFollowing ?? false;
        return newState;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-semibold text-center flex-1">
            Likes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Close likes modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No likes yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map(user => {
                const isOwnProfile = currentUser?.id === user.id;
                const isFollowing = followingStates[user.id] ?? false;

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Profile picture */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={user.name}
                          width={44}
                          height={44}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-medium truncate">
                        {user.username}
                      </div>
                      <div className="text-gray-500 text-sm truncate">
                        {user.name}
                      </div>
                    </div>

                    {/* Follow button */}
                    {!isOwnProfile && (
                      <button
                        onClick={() => handleFollowToggle(user.id)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          isFollowing
                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;
