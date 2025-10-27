/**
 * Search Loading Skeleton
 *
 * Provides loading skeletons for search results to improve
 * perceived performance while data is being fetched
 */

interface SearchLoadingSkeletonProps {
  type: 'people' | 'groups';
  count?: number;
}

export function SearchLoadingSkeleton({
  type,
  count = 5,
}: SearchLoadingSkeletonProps) {
  if (type === 'people') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-4 border-b border-gray-100 last:border-0 animate-pulse"
          >
            <div className="flex items-center space-x-4">
              {/* Avatar skeleton */}
              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />

              {/* Content skeleton */}
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-48" />
              </div>

              {/* Button skeleton */}
              <div className="h-8 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Groups skeleton
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg overflow-hidden p-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            {/* Group icon skeleton */}
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>

            {/* Button skeleton */}
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Suggestions Loading Skeleton
 *
 * Skeleton for suggested users/groups section
 */
export function SuggestionsLoadingSkeleton() {
  return (
    <div className="p-8 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]" />
      <p className="text-gray-600 mt-4">Loading suggestions...</p>
    </div>
  );
}
