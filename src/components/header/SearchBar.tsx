'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronDown } from 'lucide-react';
import type { SearchBarProps, SearchFilter } from './header.types';
import { SEARCH_FILTERS } from './header.constants';
import { getSearchFilterLabel, buildSearchUrl } from './header.utils';

/**
 * SearchBar Component
 *
 * Handles all search-related functionality including:
 * - Collapsible search input
 * - Filter selection (people/groups/challenges)
 * - Search query submission
 *
 * Follows Single Responsibility Principle by managing only search UI and logic
 *
 * @example
 * ```tsx
 * <SearchBar
 *   isOpen={isSearchOpen}
 *   onToggle={() => setIsSearchOpen(!isSearchOpen)}
 * />
 * ```
 */
export default function SearchBar({ isOpen, onToggle }: SearchBarProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Local state for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('people');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Focus search input when search opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Handles search form submission
   * Navigates to search results page with query parameters
   */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const searchUrl = buildSearchUrl(searchQuery, searchFilter);
    if (searchUrl) {
      router.push(searchUrl);
      handleClose();
    }
  };

  /**
   * Closes search bar and resets state
   */
  const handleClose = () => {
    onToggle();
    setSearchQuery('');
    setIsFilterDropdownOpen(false);
  };

  /**
   * Updates search filter and closes dropdown
   */
  const handleFilterSelect = (filter: SearchFilter) => {
    setSearchFilter(filter);
    setIsFilterDropdownOpen(false);
  };

  // Collapsed state - just show search icon button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="p-2 text-gray-600 hover:text-[#0066CC] transition-colors"
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>
    );
  }

  // Expanded state - show full search form
  return (
    <div className="flex items-center space-x-1 md:space-x-2 flex-1 md:flex-none">
      <form
        onSubmit={handleSearch}
        className="flex items-center space-x-1 md:space-x-2 flex-1 md:flex-none"
      >
        {/* Filter Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="flex items-center space-x-1 md:space-x-1.5 px-2 md:px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap text-xs md:text-sm"
            aria-label="Select search filter"
            aria-expanded={isFilterDropdownOpen}
          >
            {/* Show full label on desktop, first letter on mobile */}
            <span className="font-medium hidden md:inline">
              {getSearchFilterLabel(searchFilter)}
            </span>
            <span className="font-medium md:hidden">
              {getSearchFilterLabel(searchFilter).charAt(0)}
            </span>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
          </button>

          {/* Filter Dropdown Menu */}
          {isFilterDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {SEARCH_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterSelect(value)}
                  className={`w-full text-left px-4 py-2 transition-colors ${
                    searchFilter === value
                      ? 'bg-blue-50 text-[#0066CC]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:w-80 md:flex-none min-w-0">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${getSearchFilterLabel(searchFilter).toLowerCase()}...`}
            className="w-full px-3 md:px-4 py-2 pr-8 md:pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-xs md:text-sm"
            aria-label="Search query"
          />
          <Search className="w-3 h-3 md:w-4 md:h-4 absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </form>

      {/* Close Button */}
      <button
        type="button"
        onClick={handleClose}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Close search"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
