'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-40">
      <div className="flex items-center justify-center h-10 relative">
        {/* Profile Picture - Smaller and on left */}
        <Link href="/you?tab=profile" className="absolute left-0 top-1/2 -translate-y-1/2">
          {user.profilePicture ? (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={user.profilePicture}
                alt={user.name}
                width={64}
                height={64}
                quality={90}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Page Title - Centered */}
        <h1 className="text-lg font-bold text-gray-900">
          {title}
        </h1>
      </div>
    </div>
  );
}
