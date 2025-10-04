'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Search, Settings, QrCode, Edit } from 'lucide-react';
import Link from 'next/link';

export default function MobileProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white md:hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-40">
        <div className="flex items-center justify-between h-10">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-gray-900" />
            <Search className="w-5 h-5 text-gray-900" />
            <Settings className="w-5 h-5 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-6 pb-4">
        {/* Profile Picture */}
        <div className="w-24 h-24 bg-[#FC4C02] rounded-full flex items-center justify-center mb-4">
          <span className="text-white font-bold text-4xl">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Name and Location */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
        <p className="text-gray-600 mb-4">Seattle, Washington</p>

        {/* Stats */}
        <div className="flex gap-8 mb-4">
          <div>
            <div className="text-sm text-gray-600">Following</div>
            <div className="text-xl font-bold">10</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Followers</div>
            <div className="text-xl font-bold">0</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#FC4C02] text-[#FC4C02] rounded-xl font-medium">
            <QrCode className="w-5 h-5" />
            Share my QR Code
          </button>
          <Link href="/settings" className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#FC4C02] text-[#FC4C02] rounded-xl font-medium">
            <Edit className="w-5 h-5" />
            Edit
          </Link>
        </div>
      </div>

      {/* This Week Section */}
      <div className="px-4 py-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 text-[#FC4C02]">📊</div>
          <h2 className="text-lg font-bold">This week</h2>
        </div>

        <div className="flex gap-6 mb-4">
          <div>
            <div className="text-sm text-gray-600">Distance</div>
            <div className="text-xl font-bold">0.00 mi</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Time</div>
            <div className="text-xl font-bold">0h</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Elevation</div>
            <div className="text-xl font-bold">0 ft</div>
          </div>
        </div>

        {/* Simple chart placeholder */}
        <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-between px-2 pb-2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gray-200 rounded-full"
              style={{ height: '20%' }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>AUG</span>
          <span>SEP</span>
          <span>OCT</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="border-t border-gray-200">
        <Link href="/activities" className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              📈
            </div>
            <span className="font-medium">Activities</span>
          </div>
          <span className="text-gray-400">›</span>
        </Link>

        <Link href="/statistics" className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              📊
            </div>
            <span className="font-medium">Statistics</span>
          </div>
          <span className="text-gray-400">›</span>
        </Link>

        <Link href="/routes" className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              🗺️
            </div>
            <span className="font-medium">Routes</span>
          </div>
          <span className="text-gray-400">›</span>
        </Link>
      </div>

      {/* Bottom spacing for nav */}
      <div className="h-24"></div>
    </div>
  );
}
