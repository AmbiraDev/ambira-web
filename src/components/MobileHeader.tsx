'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-40">
      <div className="flex items-center justify-center h-8 relative">
        {/* Profile Picture - Smaller and on left */}
        <Link href="/you?tab=profile" className="absolute left-0">
          <div className="w-8 h-8 bg-[#FC4C02] rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </Link>

        {/* Page Title - Centered */}
        <h1 className="text-base font-bold text-gray-900">
          {title}
        </h1>
      </div>
    </div>
  );
}
