import React from 'react';
import Image from 'next/image';
import { Users } from 'lucide-react';

interface GroupAvatarProps {
  imageUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export default function GroupAvatar({
  imageUrl,
  name,
  size = 'md',
  className = ''
}: GroupAvatarProps) {
  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm border border-gray-200 ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
          height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
          className="w-full h-full object-cover"
        />
      ) : (
        <Users className={`${iconSizes[size]} text-gray-600`} />
      )}
    </div>
  );
}
