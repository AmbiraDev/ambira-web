'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, MapPin } from 'lucide-react';

interface UnifiedProfileCardProps {
  // User data
  name: string;
  username: string;
  profilePicture?: string | null;
  bio?: string | null;
  location?: string | null;

  // Stats
  followersCount: number;
  followingCount: number;

  // Actions
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  editButtonHref?: string;

  // Optional extras
  showBio?: boolean;
  showLocation?: boolean;
  className?: string;
}

export const UnifiedProfileCard: React.FC<UnifiedProfileCardProps> = ({
  name,
  username,
  profilePicture,
  bio,
  location,
  followersCount,
  followingCount,
  isOwnProfile = false,
  onEditClick,
  editButtonHref = '/settings',
  showBio = true,
  showLocation = true,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* Profile Picture */}
      {profilePicture ? (
        <div className="w-24 h-24 rounded-full mb-4 overflow-hidden ring-4 ring-white">
          <Image
            src={profilePicture}
            alt={`${name}'s profile picture`}
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-24 h-24 bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center mb-4">
          <span className="text-white font-bold text-4xl">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Name and Username */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{name}</h1>
      <p className="text-gray-500 mb-3">@{username}</p>

      {/* Bio */}
      {showBio && bio && (
        <p className="text-gray-700 mb-3 leading-relaxed">
          {bio}
        </p>
      )}

      {/* Location */}
      {showLocation && location && (
        <div className="flex items-center gap-1 text-gray-600 mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-8 mb-4">
        <div>
          <div className="text-sm text-gray-600">Following</div>
          <div className="text-xl font-bold text-gray-900">
            {followingCount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Followers</div>
          <div className="text-xl font-bold text-gray-900">
            {followersCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {isOwnProfile && (
        <div className="flex gap-2">
          <Link
            href={editButtonHref}
            onClick={onEditClick}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
          >
            <Edit className="w-5 h-5" />
            Edit Profile
          </Link>
        </div>
      )}
    </div>
  );
};
