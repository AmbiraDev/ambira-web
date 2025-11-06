'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useUserGroups,
  useJoinGroup,
  useLeaveGroup,
} from '@/features/groups/hooks';
import { useSuggestedGroups } from '@/features/search/hooks';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import { MyGroupListItem } from '@/components/MyGroupListItem';
import { SuggestedGroupListItem } from '@/components/SuggestedGroupListItem';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { Group } from '@/types';
import { GROUP_DISPLAY_CONFIG } from '@/lib/constants/groupDisplay';

export default function GroupsPage() {
  const { user } = useAuth();
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's groups
  const { data: userGroups = [], isLoading: isLoadingUserGroups } =
    useUserGroups(user?.id || '', {
      enabled: !!user?.id,
    });

  // Fetch suggested groups (automatically filters out joined groups)
  const {
    suggestedGroups: fetchedSuggestedGroups,
    isLoading: isLoadingSuggestedGroups,
  } = useSuggestedGroups({
    userId: user?.id,
    enabled: !!user?.id,
    limit: GROUP_DISPLAY_CONFIG.SUGGESTED_GROUPS_LIMIT,
  });

  // Memoize the groups type conversion
  const suggestedGroups = useMemo(
    () =>
      fetchedSuggestedGroups
        .slice(0, GROUP_DISPLAY_CONFIG.SUGGESTED_GROUPS_LIMIT)
        .map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          category: (g.category as Group['category']) || 'other',
          type: 'professional' as const,
          privacySetting: 'public' as const,
          memberCount: g.memberCount || 0,
          adminUserIds: [],
          memberIds: [],
          createdByUserId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          imageUrl: g.imageUrl,
          location: g.location,
        })),
    [fetchedSuggestedGroups]
  );

  // Mutations for joining/leaving groups
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();

  // Memoize the joined group IDs set
  const joinedGroupIds = useMemo(
    () => new Set(userGroups.map(g => g.id)),
    [userGroups]
  );

  // Memoize the join handler
  const handleJoinGroup = useCallback(
    async (groupId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) return;

      const isJoined = joinedGroupIds.has(groupId);
      setError(null); // Clear any previous errors

      try {
        setJoiningGroupId(groupId);

        if (isJoined) {
          await leaveGroupMutation.mutateAsync({ groupId, userId: user.id });
        } else {
          await joinGroupMutation.mutateAsync({ groupId, userId: user.id });
        }
      } catch (err) {
        setError(
          isJoined
            ? 'Failed to leave group. Please try again.'
            : 'Failed to join group. Please try again.'
        );
      } finally {
        setJoiningGroupId(null);
      }
    },
    [user, joinedGroupIds, joinGroupMutation, leaveGroupMutation]
  );

  // Handle Escape key to dismiss error messages
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && error) {
        setError(null);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [error]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view groups
          </h1>
          <p className="text-gray-600">
            You need to be logged in to join groups and challenges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader
        title="Groups"
        showNotifications={true}
        showProfilePicture={false}
      />

      <div className="flex-1 w-full max-w-[1400px] mx-auto pt-6 pb-4 md:py-8 min-h-[calc(100vh-3.5rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 px-6 md:px-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              My Groups
            </h1>
          </div>
          <Link
            href="/groups/new"
            aria-label="Create a new group"
            className="min-h-[44px] px-4 py-2 md:px-6 md:py-2.5 bg-[#0066CC] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
          >
            Create a Group
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mx-6 md:mx-8 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
          >
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss error"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* My Groups - Vertical List */}
        {isLoadingUserGroups ? (
          <div>
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="py-5 px-6 md:px-8 border-b border-gray-200"
                >
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="h-6 md:h-7 bg-gray-200 rounded w-48 md:w-64 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32 md:w-96 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-40 md:w-80 animate-pulse"></div>
                        <div className="hidden md:block h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : userGroups.length > 0 ? (
          <div className="space-y-0">
            {userGroups.map(group => (
              <MyGroupListItem key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 md:px-8">
            <div className="max-w-md mx-auto">
              <Users
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You haven't joined any groups yet
              </h3>
              <p className="text-gray-600 mb-6">
                Search for groups to connect with like-minded people,
                participate in challenges, and stay motivated!
              </p>
              <Link
                href="/search?type=groups"
                aria-label="Search for groups"
                className="min-h-[44px] px-6 py-2.5 bg-[#0066CC] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
              >
                Search for Groups
              </Link>
            </div>
          </div>
        )}

        {/* Suggested Groups Section - Matching My Groups Style */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6 px-6 md:px-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Suggested Groups
              </h2>
            </div>
            <Link
              href="/search?type=groups"
              aria-label="Browse all groups"
              className="text-sm font-semibold text-[#0066CC] hover:text-[#0051D5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 rounded"
            >
              See All
            </Link>
          </div>

          {isLoadingSuggestedGroups ? (
            <div>
              <div className="space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="py-5 px-6 md:px-8 border-b border-gray-200"
                  >
                    <div className="flex items-start gap-4 md:gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="h-6 md:h-7 bg-gray-200 rounded w-48 md:w-64 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32 md:w-96 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-40 md:w-80 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-11 w-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : suggestedGroups.length > 0 ? (
            <div className="space-y-0">
              {suggestedGroups.map(group => (
                <SuggestedGroupListItem
                  key={group.id}
                  group={group}
                  onJoin={handleJoinGroup}
                  isJoining={joiningGroupId === group.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 md:px-8">
              <div className="max-w-md mx-auto">
                <Users
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No groups to suggest
                </h3>
                <p className="text-gray-600 mb-6">
                  You've joined all available groups, or there are no public
                  groups yet. Check back later or create your own!
                </p>
                <Link
                  href="/groups/new"
                  aria-label="Create a new group"
                  className="min-h-[44px] px-6 py-2.5 bg-[#0066CC] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
                >
                  Create a Group
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - hidden on mobile */}
      <Footer />

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
