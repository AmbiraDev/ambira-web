'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import GroupAvatar from '@/components/GroupAvatar';
import { firebaseUserApi, firebaseApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { UserCardCompact } from '@/components/UserCard';
import { collection, query as firestoreQuery, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, MapPin } from 'lucide-react';

// Mock data for search results
const mockUsers = [
  { id: '1', name: 'Alex Johnson', username: 'alexj', bio: 'Full-stack developer building cool things', location: 'San Francisco, CA', followers: 234, following: 123, avatar: '👨‍💻' },
  { id: '2', name: 'Sarah Chen', username: 'sarahc', bio: 'Product designer & productivity enthusiast', location: 'New York, NY', followers: 456, following: 234, avatar: '👩‍🎨' },
  { id: '3', name: 'Mike Williams', username: 'mikew', bio: 'Studying CS @ MIT', location: 'Boston, MA', followers: 123, following: 89, avatar: '🎓' },
  { id: '4', name: 'Emma Davis', username: 'emmad', bio: 'Entrepreneur & startup founder', location: 'Austin, TX', followers: 789, following: 345, avatar: '💼' },
];

const mockGroups = [
  { id: '1', name: 'CS Study Group', description: 'Computer science students helping each other', members: 1234, category: 'Study', location: 'Global', image: '💻' },
  { id: '2', name: 'Early Morning Grinders', description: 'Wake up early, grind hard', members: 567, category: 'Professional', location: 'San Francisco, CA', image: '☀️' },
  { id: '3', name: 'Side Project Squad', description: 'Building side projects together', members: 890, category: 'Side Project', location: 'Remote', image: '🚀' },
  { id: '4', name: 'Productivity Nerds', description: 'Optimizing every minute of the day', members: 2345, category: 'Fun', location: 'Global', image: '⚡' },
];


function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'suggested') as 'suggested' | 'people' | 'groups';

  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [showAllPeople, setShowAllPeople] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const { user } = useAuth();

  // Load suggested content on mount
  useEffect(() => {
    if (type !== 'suggested') return;
    if (!user) return; // Wait for user to be authenticated

    let isMounted = true;
    setIsLoading(true);

    const run = async () => {
      try {
        // Load users - sorted by follower count
        try {
          const { users } = await firebaseUserApi.searchUsers('', 1, 50);
          if (!isMounted) return;
          const filtered = users
            .filter(u => u.id !== user?.id)
            .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
          setSuggestedUsers(filtered);
        } catch (error) {
          console.error('Error loading users:', error);
          if (isMounted) setSuggestedUsers([]);
        }

        // Load groups - get all public groups by querying directly
        try {
          const allGroupsSnapshot = await getDocs(
            firestoreQuery(collection(db, 'groups'), orderBy('memberCount', 'desc'), limit(20))
          );
          const groups = allGroupsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              description: data.description,
              imageUrl: data.imageUrl,
              location: data.location,
              category: data.category,
              memberCount: data.memberCount,
              members: data.memberCount,
              image: data.imageUrl || '📁'
            };
          });
          if (isMounted) setSuggestedGroups(groups);
        } catch (error) {
          console.error('Error loading groups:', error);
          if (isMounted) setSuggestedGroups([]);
        }

      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    run();

    return () => { isMounted = false; };
  }, [type, user?.id]);

  useEffect(() => {
    // Only search if there's a query
    if (!initialQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const run = async () => {
      try {
        if (type === 'people') {
          const { users } = await firebaseUserApi.searchUsers(initialQuery, 1, 20);
          if (!isMounted) return;
          const enhanced = users.map(u => ({ ...u, isSelf: user && u.id === user.id }));
          enhanced.sort((a, b) => (b.isSelf ? 1 : 0) - (a.isSelf ? 1 : 0));
          setResults(enhanced);
        } else {
          setResults([]);
        }
      } catch {
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    run();

    return () => { isMounted = false; };
  }, [initialQuery, type]);

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setResults(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, isFollowing, followersCount: isFollowing ? user.followersCount + 1 : Math.max(0, user.followersCount - 1) }
          : user
      )
    );
    setSuggestedUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, isFollowing, followersCount: isFollowing ? user.followersCount + 1 : Math.max(0, user.followersCount - 1) }
          : user
      )
    );
  };

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    const isJoined = joinedGroups.has(groupId);
    
    try {
      setJoiningGroup(groupId);
      
      if (isJoined) {
        await firebaseApi.group.leaveGroup(groupId, user.id);
        setJoinedGroups(prev => {
          const newSet = new Set(prev);
          newSet.delete(groupId);
          return newSet;
        });
      } else {
        await firebaseApi.group.joinGroup(groupId, user.id);
        setJoinedGroups(prev => new Set(prev).add(groupId));
      }
    } catch (error) {
      console.error('Failed to join/leave group:', error);
    } finally {
      setJoiningGroup(null);
    }
  };


  const renderUserResult = (user: any) => {
    if (user.isSelf) {
      return (
        <Link
          key={user.id}
          href={`/profile/${user.username}`}
          className="block border-b border-gray-100 last:border-0"
        >
          <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold bg-green-100 text-green-800 ring-2 ring-green-400">
                {(user.username?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">@{user.username}</p>
                {user.bio && <p className="text-sm text-gray-700 mt-1">{user.bio}</p>}
                <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  This is you
                </span>
              </div>
            </div>
          </div>
        </Link>
      );
    }
    
    return (
      <div key={user.id} className="border-b border-gray-100 last:border-0">
        <UserCardCompact 
          user={user} 
          variant="search"
          onFollowChange={handleFollowChange}
        />
      </div>
    );
  };

  const renderGroupResult = (group: any) => {
    const isJoined = joinedGroups.has(group.id);
    const isLoading = joiningGroup === group.id;

    return (
      <div className="p-3 transition-colors">
        <div className="flex items-center gap-3">
          {/* Group Icon */}
          <Link href={`/groups/${group.id}`}>
            <GroupAvatar
              imageUrl={group.imageUrl}
              name={group.name}
              size="md"
            />
          </Link>

          {/* Group Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/groups/${group.id}`}>
              <p className="font-semibold text-sm text-gray-900 hover:text-[#007AFF] truncate mb-0.5 transition-colors">
                {group.name}
              </p>
            </Link>
            <div className="text-xs text-gray-500">
              {group.memberCount || group.members || 0} {(group.memberCount || group.members) === 1 ? 'member' : 'members'}
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={(e) => handleJoinGroup(group.id, e)}
            disabled={isLoading}
            className={`text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
              isJoined
                ? 'text-gray-600 hover:text-gray-900'
                : 'text-[#007AFF] hover:text-[#0051D5]'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              'Joining...'
            ) : isJoined ? (
              'Joined'
            ) : (
              'Join'
            )}
          </button>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - only show on desktop */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Mobile search header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-900">Discover</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4 md:py-8 md:pt-24">
        {/* Search Info - only show if there's a query */}
        {initialQuery && (
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results for "{initialQuery}"
            </h1>
            <p className="text-gray-600 mt-1">
              Searching in {type.charAt(0).toUpperCase() + type.slice(1)}
            </p>
          </div>
        )}

        {/* Mobile Search Form */}
        <div className="md:hidden mb-6">
          <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query.trim())}&type=${type}`; }}>
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => window.location.href = `/search?type=suggested`}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all border-r border-gray-200 last:border-r-0 ${
                    type === 'suggested' ? 'bg-[#007AFF] text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Suggested
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=people`}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all border-r border-gray-200 last:border-r-0 ${
                    type === 'people' ? 'bg-[#007AFF] text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  People
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=groups`}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                    type === 'groups' ? 'bg-[#007AFF] text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Groups
                </button>
              </div>

              {/* Search Input - hide for suggested tab */}
              {type !== 'suggested' && (
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${type}...`}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC4C02] focus:border-transparent text-base"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#FC4C02] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Results */}
        <div>
          {type === 'suggested' ? (
            isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
                <p className="text-gray-600 mt-4">Loading suggestions...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Suggested People */}
                {suggestedUsers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-lg font-semibold text-gray-900">Suggested for you</h3>
                      {suggestedUsers.length > 5 && !showAllPeople && (
                        <button
                          onClick={() => setShowAllPeople(true)}
                          className="text-xs text-[#007AFF] hover:text-[#0056D6] font-semibold"
                        >
                          See all
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {(showAllPeople ? suggestedUsers : suggestedUsers.slice(0, 5)).map((suggestedUser) => (
                        <div key={suggestedUser.id} className="bg-white rounded-lg overflow-hidden">
                          <UserCardCompact
                            user={suggestedUser}
                            variant="search"
                            onFollowChange={handleFollowChange}
                          />
                        </div>
                      ))}
                    </div>
                    {suggestedUsers.length > 5 && showAllPeople && (
                      <button
                        onClick={() => setShowAllPeople(false)}
                        className="w-full text-center text-[#007AFF] font-semibold text-sm py-3 hover:text-[#0056D6] transition-colors mt-2"
                      >
                        Show Less
                      </button>
                    )}
                  </div>
                )}

                {/* Suggested Groups */}
                {suggestedGroups.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-lg font-semibold text-gray-900">Groups to join</h3>
                      {suggestedGroups.length > 3 && !showAllGroups && (
                        <button
                          onClick={() => setShowAllGroups(true)}
                          className="text-xs text-[#007AFF] hover:text-[#0056D6] font-semibold"
                        >
                          See all
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {(showAllGroups ? suggestedGroups : suggestedGroups.slice(0, 3)).map((group) => (
                        <div
                          key={group.id}
                          className="bg-white rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                        >
                          {renderGroupResult(group)}
                        </div>
                      ))}
                    </div>
                    {suggestedGroups.length > 3 && showAllGroups && (
                      <button
                        onClick={() => setShowAllGroups(false)}
                        className="w-full text-center text-[#007AFF] font-semibold text-sm py-3 hover:text-[#0056D6] transition-colors mt-2"
                      >
                        Show Less
                      </button>
                    )}
                  </div>
                )}

              </div>
            )
          ) : !initialQuery.trim() ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center">
              <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Start searching</h3>
              <p className="text-gray-600 mt-2">
                Enter a search query to find {type}
              </p>
            </div>
          ) : isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
              <p className="text-gray-600 mt-4">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
              <p className="text-gray-600 mt-2">
                No {type} found matching "{initialQuery}"
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Try a different search term or filter
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-2">
                <p className="text-sm text-gray-600">
                  Found {results.length} {results.length === 1 ? 'result' : 'results'}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {type === 'people' && results.map(renderUserResult)}
                {type === 'groups' && results.map(renderGroupResult)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

