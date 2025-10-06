'use client';

import React from 'react';
import Image from 'next/image';
import { User } from '@/types';

interface ProfilePictureProps {
  user: Pick<User, 'name' | 'profilePicture'>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const sizePixels = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
};

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  user,
  size = 'md',
  className = '',
  showBorder = false,
}) => {
  const sizeClass = sizeClasses[size];
  const borderClass = showBorder ? 'border-2 border-border' : '';
  const [imageError, setImageError] = React.useState(false);

  if (user.profilePicture && !imageError) {
    return (
      <div className={`${sizeClass} relative ${borderClass} ${className} rounded-full overflow-hidden`}>
        <Image
          src={user.profilePicture}
          alt={`${user.name}'s profile picture`}
          fill
          className="object-cover"
          sizes={`${sizePixels[size]}px`}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initials
  const initials = user.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ${borderClass} ${className}`}
    >
      {initials}
    </div>
  );
};
