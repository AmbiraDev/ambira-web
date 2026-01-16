'use client'

import { useState, useEffect } from 'react'
import MobileHeader from '@/components/MobileHeader'
import LeftSidebar from '@/components/LeftSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import { firebaseUserApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { UserCardCompact } from '@/features/social/components/UserCard'
import { Users as UsersIcon } from 'lucide-react'
import type { SuggestedUser } from '@/types'

export default function DiscoverPeoplePage() {
  const { user } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Load suggested users (filters by profileVisibility and excludes following)
        // Limit to 5 to avoid revealing total user count
        const suggestions = await firebaseUserApi.getSuggestedUsers(5)

        setSuggestedUsers(suggestions)
      } catch (_error: unknown) {
        setSuggestedUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [user])

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update user data
    setSuggestedUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              isFollowing,
              followersCount: isFollowing
                ? (u.followersCount || 0) + 1
                : Math.max(0, (u.followersCount || 0) - 1),
            }
          : u
      )
    )

    // Remove from suggestions after following
    if (isFollowing) {
      setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <MobileHeader title="Discover People" />

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="flex justify-center">
          {/* Left Sidebar - Fixed, hidden on mobile */}
          <div className="hidden lg:block flex-shrink-0">
            <LeftSidebar />
          </div>

          {/* Content Area - with left margin on desktop for fixed sidebar */}
          <div className="flex-1 lg:ml-[256px]">
            <div className="w-full max-w-2xl mx-auto pt-6 pb-4 lg:py-8 min-h-[calc(100vh-3.5rem)]">
              {/* Page Header */}
              <div className="mb-6 px-6 lg:px-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Discover People
                </h1>
                <p className="text-gray-600">Here are some people you might want to follow</p>
              </div>

              {/* Content */}
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
                  <p className="text-gray-600 mt-4">Finding people for you...</p>
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UsersIcon className="w-10 h-10 text-[#0066CC]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No suggestions yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    We'll show you people to connect with as the community grows. Check back later!
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mx-6 lg:mx-0">
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
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 lg:hidden" />

      <BottomNavigation />
    </div>
  )
}
