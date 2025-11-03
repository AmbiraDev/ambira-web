'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroups } from '@/features/groups/hooks';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import { MyGroupListItem } from '@/components/MyGroupListItem';
import { Users } from 'lucide-react';
import Link from 'next/link';

export default function GroupsPage() {
  const { user } = useAuth();

  // Use new group hooks - only fetch user's groups
  const { data: userGroups = [], isLoading: isLoadingUserGroups } =
    useUserGroups(user?.id || '', {
      enabled: !!user?.id,
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view groups
          </h1>
          <p className="text-gray-600">
            You need to be logged in to join groups and challenges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="Groups" showNotifications={true} showProfilePicture={false} />

      <div className="flex-1 w-full max-w-[1400px] mx-auto pt-6 pb-4 md:py-8 min-h-[calc(100vh-3.5rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 px-6 md:px-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              My Groups
            </h1>
          </div>
          <Link
            href="/groups/new"
            aria-label="Create a new group"
            className="min-h-[44px] px-4 py-2 md:px-6 md:py-2.5 bg-[#0066CC] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
          >
            Create a Group
          </Link>
        </div>

        {/* My Groups - Vertical List */}
        {isLoadingUserGroups ? (
          <div>
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-5 px-6 md:px-8 border-b border-gray-200">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="h-6 md:h-7 bg-gray-200 rounded w-48 md:w-64 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32 md:w-96 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-40 md:w-80 animate-pulse"></div>
                        <div className="hidden md:block h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : userGroups.length > 0 ? (
          <div className="space-y-0">
            {userGroups.map(group => (
              <MyGroupListItem key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-white border border-gray-200 rounded-lg mx-6 md:mx-8">
            <div className="max-w-md mx-auto">
              <Users
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You haven't joined any groups yet
              </h3>
              <p className="text-gray-600 mb-6">
                Search for groups to connect with like-minded people, participate
                in challenges, and stay motivated!
              </p>
              <Link
                href="/search"
                aria-label="Search for groups"
                className="min-h-[44px] px-6 py-2.5 bg-[#0066CC] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
              >
                Search for Groups
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer - hidden on mobile */}
      <Footer />

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
