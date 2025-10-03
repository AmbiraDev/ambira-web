'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { UserCardCompact } from '@/components/UserCard';

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

const mockChallenges = [
  { id: '1', name: '30 Day Study Streak', description: 'Study every day for 30 days straight', participants: 456, endDate: '2025-11-01', group: 'CS Study Group', image: '🔥' },
  { id: '2', name: '100 Hours in October', description: 'Log 100 hours of focused work this month', participants: 234, endDate: '2025-10-31', group: 'Productivity Nerds', image: '💯' },
  { id: '3', name: 'Most Productive Week', description: 'Who can log the most hours this week?', participants: 123, endDate: '2025-10-08', group: 'Early Morning Grinders', image: '🏆' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'people') as 'people' | 'groups' | 'challenges';
  
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { user } = useAuth();

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

  const renderGroupResult = (group: any) => (
    <Link
      key={group.id}
      href={`/groups/${group.id}`}
      className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-2xl">
            {group.image}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{group.name}</h3>
            <p className="text-sm text-gray-700 mt-1">{group.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>📍 {group.location}</span>
              <span>👥 {group.members.toLocaleString()} members</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{group.category}</span>
            </div>
          </div>
        </div>
        <button className="px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg hover:bg-[#0056D6] transition-colors">
          Join
        </button>
      </div>
    </Link>
  );

  const renderChallengeResult = (challenge: any) => (
    <Link
      key={challenge.id}
      href={`/challenges/${challenge.id}`}
      className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-2xl">
            {challenge.image}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
            <p className="text-sm text-gray-700 mt-1">{challenge.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>🏢 {challenge.group}</span>
              <span>👥 {challenge.participants} participants</span>
              <span>📅 Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <button className="px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg hover:bg-[#0056D6] transition-colors">
          Join Challenge
        </button>
      </div>
    </Link>
  );

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
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=people`}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    type === 'people' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  People
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=groups`}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    type === 'groups' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Groups
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=challenges`}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    type === 'challenges' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Challenges
                </button>
              </div>
              
              {/* Search Input */}
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
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {!initialQuery.trim() ? (
            <div className="p-8 md:p-12 text-center">
              <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Start searching</h3>
              <p className="text-gray-600 mt-2">
                Enter a search query to find {type}
              </p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
              <p className="text-gray-600 mt-4">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center">
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
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  Found {results.length} {results.length === 1 ? 'result' : 'results'}
                </p>
              </div>
              <div>
                {type === 'people' && results.map(renderUserResult)}
                {type === 'groups' && results.map(renderGroupResult)}
                {type === 'challenges' && results.map(renderChallengeResult)}
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

