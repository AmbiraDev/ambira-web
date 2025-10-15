'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { UserCardCompact } from '@/components/UserCard';
import { ArrowLeft, Users as UsersIcon } from 'lucide-react';

export default function DiscoverPeoplePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadUsers = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load the list of users we're already following
        try {
          const following = await firebaseUserApi.getFollowing(user.id);
          const followingIds = new Set(following.map(u => u.id));
          setFollowingUsers(followingIds);
        } catch (error) {
          console.error('Failed to load following list:', error);
        }

        // Load suggested users (filters by profileVisibility and excludes following)
        // Limit to 5 to avoid revealing total user count
        const suggestions = await firebaseUserApi.getSuggestedUsers(5);

        setSuggestedUsers(suggestions);
      } catch (error) {
        console.error('Error loading users:', error);
        setSuggestedUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [user]);

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update following state
    setFollowingUsers(prev => {
      const next = new Set(prev);
      if (isFollowing) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });

    // Update user data
    setSuggestedUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? {
              ...u,
              isFollowing,
              followersCount: isFollowing
                ? (u.followersCount || 0) + 1
                : Math.max(0, (u.followersCount || 0) - 1)
            }
          : u
      )
    );

    // Remove from suggestions after following
    if (isFollowing) {
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header */}
      <MobileHeader title="Discover People" />

      <div className="max-w-4xl mx-auto px-0 md:px-6 md:py-8 md:pt-24">
        {/* Page Header - Desktop */}
        <div className="mb-8 hidden md:block px-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover People</h1>
            <p className="text-gray-600">
              Here are some people you might want to follow
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
            <p className="text-gray-600 mt-4">Finding people for you...</p>
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-10 h-10 text-[#007AFF]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No suggestions yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We'll show you people to connect with as the community grows. Check back later!
            </p>
          </div>
        ) : (
          <div>
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Who to Follow
              </h2>
            </div>

            {/* People List */}
            <div className="divide-y divide-gray-200">
              {suggestedUsers.map((suggestedUser) => (
                <div key={suggestedUser.id}>
                  <UserCardCompact
                    user={suggestedUser}
                    variant="search"
                    onFollowChange={handleFollowChange}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
