/**
 * GroupMembersList Component
 *
 * Displays a list of group members with their profiles.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { Users, Loader2 } from 'lucide-react';

interface GroupMembersListProps {
  groupId: string;
}

export function GroupMembersList({ groupId }: GroupMembersListProps) {
  const { data: members, isLoading, error } = useGroupMembers(groupId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">Failed to load members</p>
        <p className="text-sm text-red-600 mt-1">Please try again later</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No members yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Be the first to join this group!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {members.length} member{members.length !== 1 ? 's' : ''}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {members.map(member => (
          <Link
            key={member.id}
            href={`/profile/${member.username}`}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            {/* Profile Picture */}
            {member.profilePicture ? (
              <Image
                src={member.profilePicture}
                alt={member.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-lg">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {member.name}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                @{member.username}
              </p>
              {member.bio && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {member.bio}
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
