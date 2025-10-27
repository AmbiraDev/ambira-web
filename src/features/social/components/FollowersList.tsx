/**
 * FollowersList Component
 *
 * Displays a list of users who follow the profile user.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFollowers } from '../hooks/useFollowers';
import { Users, Loader2 } from 'lucide-react';

interface FollowersListProps {
  userId: string;
}

export function FollowersList({ userId }: FollowersListProps) {
  const { data: followers, isLoading, error } = useFollowers(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading followers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">Failed to load followers</p>
        <p className="text-sm text-red-600 mt-1">Please try again later</p>
      </div>
    );
  }

  if (!followers || followers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No followers yet</p>
        <p className="text-sm text-gray-500 mt-1">
          When people follow this user, they'll appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {followers.map(follower => (
          <Link
            key={follower.id}
            href={`/profile/${follower.username}`}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            {/* Profile Picture */}
            {follower.profilePicture ? (
              <Image
                src={follower.profilePicture}
                alt={follower.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-semibold text-lg">
                  {follower.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {follower.name}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                @{follower.username}
              </p>
              {follower.bio && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {follower.bio}
                </p>
              )}
            </div>

            {/* Arrow indicator */}
            <svg
              className="w-5 h-5 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
