'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { firebaseUserApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { UserCardCompact } from '@/components/UserCard';
import type { SuggestedUser } from '@/types';

interface SuggestedPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const USERS_PER_PAGE = 10;
const TOTAL_USERS_TO_FETCH = 100;

export default function SuggestedPeopleModal({
  isOpen,
  onClose,
}: SuggestedPeopleModalProps) {
  const { user } = useAuth();
  const [allSuggestedUsers, setAllSuggestedUsers] = useState<SuggestedUser[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const loadUsers = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setCurrentPage(0);

      // Use the same getSuggestedUsers API as the sidebar
      const suggestions =
        await firebaseUserApi.getSuggestedUsers(TOTAL_USERS_TO_FETCH);
      setAllSuggestedUsers(suggestions);
    } catch {
      console.error('Error loading users');
      setAllSuggestedUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadUsers();
    }
  }, [isOpen, user, loadUsers]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Calculate paginated users
  const totalPages = Math.ceil(allSuggestedUsers.length / USERS_PER_PAGE);
  const startIndex = currentPage * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = allSuggestedUsers.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setAllSuggestedUsers(prev =>
      prev.map(u =>
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
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Suggested People</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close suggested people modal"
          >
            <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
              <p className="text-gray-600 mt-4">Loading suggestions...</p>
            </div>
          ) : allSuggestedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No suggestions yet
              </h3>
              <p className="text-gray-600">
                Check back later for people to connect with
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedUsers.map(suggestedUser => (
                <div key={suggestedUser.id}>
                  <UserCardCompact
                    user={suggestedUser}
                    variant="search"
                    onFollowChange={handleFollowChange}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && allSuggestedUsers.length > USERS_PER_PAGE && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Previous
            </button>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
