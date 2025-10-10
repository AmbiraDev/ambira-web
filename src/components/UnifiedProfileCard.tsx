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
        <div className="w-32 h-32 min-w-[8rem] aspect-square rounded-full mb-5 overflow-hidden ring-4 ring-white shadow-md flex-shrink-0">
          <Image
            src={profilePicture}
            alt={`${name}'s profile picture`}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-32 h-32 min-w-[8rem] aspect-square bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center mb-5 shadow-md flex-shrink-0">
          <span className="text-white font-bold text-5xl">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Name and Username */}
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      <p className="text-gray-500 text-base mb-2">@{username}</p>

      {/* Bio */}
      {showBio && bio && (
        <p className="text-gray-700 mb-4 leading-relaxed">
          {bio}
        </p>
      )}

      {/* Location */}
      {showLocation && location && (
        <div className="flex items-center gap-1.5 text-gray-600 mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{location}</span>
        </div>
      )}

      {/* Action Button */}
      {isOwnProfile && (
        <Link
          href={editButtonHref}
          onClick={onEditClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-semibold transition-colors text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Link>
      )}

      {/* Stats */}
      <div className="flex gap-8">
        <button className="text-left">
          <div className="text-xl font-bold text-gray-900">
            {followersCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Followers</div>
        </button>
        <button className="text-left">
          <div className="text-xl font-bold text-gray-900">
            {followingCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Following</div>
        </button>
      </div>
    </div>
  );
};
