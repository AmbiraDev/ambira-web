import { Activity } from 'lucide-react';

export interface ChartEmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function ChartEmptyState({
  icon: Icon,
  title,
  description,
  onAction,
  actionLabel = 'Start Your First Session',
}: ChartEmptyStateProps) {
  return (
    <div
      className="h-full flex items-center justify-center"
      role="status"
      aria-label={`No data: ${title}`}
    >
      <div className="text-center max-w-md px-4">
        <Icon
          className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4"
          aria-hidden="true"
        />
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm md:text-base text-gray-600 mb-4">{description}</p>
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors duration-200 font-semibold text-sm md:text-base shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
            aria-label={actionLabel}
          >
            <Activity className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
