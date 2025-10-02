'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserSearchResult } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { UserCard, UserCardCompact } from './UserCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SearchUsersProps {
  onUserSelect?: (user: UserSearchResult) => void;
  variant?: 'default' | 'compact' | 'modal';
  placeholder?: string;
  showResults?: boolean;
  maxResults?: number;
}

export const SearchUsers: React.FC<SearchUsersProps> = ({
  onUserSelect,
  variant = 'default',
  placeholder = 'Search users...',
  showResults = true,
  maxResults = 20,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, page: number = 1) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await firebaseUserApi.searchUsers(searchQuery, page, maxResults);
        
        if (page === 1) {
          setResults(response.users);
        } else {
          setResults(prev => [...prev, ...response.users]);
        }
        
        setTotalCount(response.totalCount);
        setHasMore(response.hasMore);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search users');
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [maxResults]
  );

  // Search effect
  useEffect(() => {
    setCurrentPage(1);
    debouncedSearch(query, 1);
  }, [query, debouncedSearch]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      debouncedSearch(query, nextPage);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setCurrentPage(1);
  };

  const handleUserSelect = (user: UserSearchResult) => {
    onUserSelect?.(user);
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setResults(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing, followersCount: isFollowing ? user.followersCount + 1 : Math.max(0, user.followersCount - 1) }
          : user
      )
    );
  };

  const UserCardComponent = variant === 'compact' ? UserCardCompact : UserCard;

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      )}

      {/* Results */}
      {showResults && hasSearched && (
        <div className="mt-4">
          {results.length > 0 ? (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {totalCount.toLocaleString()} result{totalCount !== 1 ? 's' : ''}
                    {query && ` for "${query}"`}
                  </span>
                </div>
              </div>

              {/* User Cards */}
              <div className="space-y-2">
                {results.map((user) => (
                  <div key={user.id} onClick={() => handleUserSelect(user)}>
                    <UserCardComponent
                      user={user}
                      variant="search"
                      onFollowChange={handleFollowChange}
                    />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : query.trim() ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">No users found</h3>
              <p className="text-sm text-muted-foreground">
                Try searching with a different name or username
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-foreground mb-1">Search for users</h3>
          <p className="text-sm text-muted-foreground">
            Find people to follow and connect with
          </p>
        </div>
      )}
    </div>
  );
};

// Modal version for overlays
interface SearchUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect?: (user: UserSearchResult) => void;
  title?: string;
}

export const SearchUsersModal: React.FC<SearchUsersModalProps> = ({
  isOpen,
  onClose,
  onUserSelect,
  title = 'Search Users',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 h-full overflow-y-auto">
            <SearchUsers
              onUserSelect={(user) => {
                onUserSelect?.(user);
                onClose();
              }}
              variant="compact"
              showResults={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
