'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Timer, Edit3 } from 'lucide-react';

export default function SessionPrompt() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white md:rounded-lg border md:border-gray-200 mb-4 p-5">
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        {user.profilePicture ? (
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={user.profilePicture}
              alt={user.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-14 h-14 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-1">
          {/* Start Session Button */}
          <Link
            href="/timer"
            className="flex items-center gap-3 px-6 py-4 rounded-lg hover:bg-gray-50 transition-colors flex-1 justify-center"
          >
            <Timer
              className="w-7 h-7 text-[#5E8B47]"
              strokeWidth={2.5}
            />
            <span className="font-bold text-lg text-gray-700">
              <span className="hidden lg:inline">Start Session</span>
              <span className="hidden sm:inline lg:hidden">Start</span>
            </span>
          </Link>

          {/* Manual Entry Button */}
          <Link
            href="/record-manual"
            className="flex items-center gap-3 px-6 py-4 rounded-lg hover:bg-gray-50 transition-colors flex-1 justify-center"
          >
            <Edit3
              className="w-7 h-7 text-[#C37D16]"
              strokeWidth={2.5}
            />
            <span className="font-bold text-lg text-gray-700">
              <span className="hidden lg:inline">Log Manually</span>
              <span className="hidden sm:inline lg:hidden">Manual</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
