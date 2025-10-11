'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, MapPin, Link as LinkIcon } from 'lucide-react';

interface UnifiedProfileCardProps {
  // User data
  name: string;
  username: string;
  profilePicture?: string | null;
  bio?: string | null;
  tagline?: string | null;
  pronouns?: string | null;
  location?: string | null;
  website?: string | null;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  } | null;

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
  tagline,
  pronouns,
  location,
  website,
  socialLinks,
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
        <div className="w-32 h-32 min-w-[8rem] aspect-square rounded-full mb-5 overflow-hidden ring-4 ring-white shadow-md flex-shrink-0 bg-white">
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

      {/* Name and Pronouns */}
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {pronouns && (
          <p className="text-gray-400 text-sm mt-0.5">{pronouns}</p>
        )}
      </div>

      {/* Username */}
      <p className="text-gray-500 text-base mb-2">@{username}</p>

      {/* Tagline */}
      {tagline && (
        <p className="text-gray-600 text-sm mb-3 font-medium">
          {tagline}
        </p>
      )}

      {/* Bio */}
      {showBio && bio && (
        <p className="text-gray-700 mb-3 leading-relaxed">
          {bio}
        </p>
      )}

      {/* Location */}
      {showLocation && location && (
        <div className="flex items-center gap-1.5 text-gray-600 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{location}</span>
        </div>
      )}

      {/* Website */}
      {website && (
        <div className="flex items-center gap-1.5 text-gray-600 mb-3">
          <LinkIcon className="w-4 h-4 flex-shrink-0" />
          <a
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#007AFF] hover:underline"
          >
            {website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}

      {/* Social Links */}
      {socialLinks && (socialLinks.twitter || socialLinks.github || socialLinks.linkedin) && (
        <div className="flex items-center gap-3 mb-4">
          {socialLinks.twitter && (
            <a
              href={`https://twitter.com/${socialLinks.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#1DA1F2] transition-colors"
              title="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          {socialLinks.github && (
            <a
              href={`https://github.com/${socialLinks.github.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          )}
          {socialLinks.linkedin && (
            <a
              href={`https://linkedin.com/in/${socialLinks.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#0A66C2] transition-colors"
              title="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
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
