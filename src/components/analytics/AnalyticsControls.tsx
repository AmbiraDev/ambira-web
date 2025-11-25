import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { IconRenderer } from '@/components/IconRenderer'

export type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y'
export type ChartType = 'bar' | 'line'

export interface Activity {
  id: string
  name: string
  icon: string
  color: string
}

export interface AnalyticsControlsProps {
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
  selectedActivityId: string
  onActivityChange: (activityId: string) => void
  chartType: ChartType
  onChartTypeChange: (type: ChartType) => void
  activities: Activity[]
}

export function AnalyticsControls({
  timePeriod,
  onTimePeriodChange,
  selectedActivityId,
  onActivityChange,
  chartType,
  onChartTypeChange,
  activities,
}: AnalyticsControlsProps) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)

  const activityTriggerRef = useRef<HTMLButtonElement>(null)
  const chartTypeTriggerRef = useRef<HTMLButtonElement>(null)

  // Handle Escape key for Activity dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProjectDropdown) {
        setShowProjectDropdown(false)
        activityTriggerRef.current?.focus()
      }
    }

    if (showProjectDropdown) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showProjectDropdown])

  // Handle Escape key for Chart Type dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showChartTypeDropdown) {
        setShowChartTypeDropdown(false)
        chartTypeTriggerRef.current?.focus()
      }
    }

    if (showChartTypeDropdown) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showChartTypeDropdown])

  const timePeriodLabels: Record<TimePeriod, string> = {
    '7D': 'Last 7 days',
    '2W': 'Last 2 weeks',
    '4W': 'Last 4 weeks',
    '3M': 'Last 3 months',
    '1Y': 'Last 1 year',
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Row 1: Activity Selector & Chart Type */}
      <div className="flex items-center gap-2">
        {/* Activity Selector */}
        <div className="relative flex-shrink-0">
          <button
            ref={activityTriggerRef}
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] min-w-[140px] max-w-[200px]"
            aria-label="Select activity to filter analytics"
            aria-expanded={showProjectDropdown}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {selectedActivityId === 'all'
                ? 'All activities'
                : activities?.find((p) => p.id === selectedActivityId)?.name || 'All activities'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
          </button>
          {showProjectDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProjectDropdown(false)} />
              <div
                className="absolute left-0 top-full mt-2 w-full max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto"
                role="listbox"
              >
                <button
                  onClick={() => {
                    onActivityChange('all')
                    setShowProjectDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-inset focus:bg-blue-50 ${selectedActivityId === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                  role="option"
                  aria-selected={selectedActivityId === 'all'}
                >
                  All
                </button>
                {(!activities || activities.length === 0) && (
                  <div className="px-4 py-2 text-xs text-gray-400">No activities yet</div>
                )}
                {activities?.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => {
                      onActivityChange(activity.id)
                      setShowProjectDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-inset focus:bg-blue-50 flex items-center gap-3 ${selectedActivityId === activity.id ? 'bg-blue-50 text-blue-600' : ''}`}
                    role="option"
                    aria-selected={selectedActivityId === activity.id}
                    aria-label={`Filter by ${activity.name}`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: activity.color + '20' }}
                    >
                      <IconRenderer iconName={activity.icon} size={18} />
                    </div>
                    <span className="truncate">{activity.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Chart Type Selector */}
        <div className="relative flex-shrink-0">
          <button
            ref={chartTypeTriggerRef}
            onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            aria-label="Select chart type for analytics visualization"
            aria-expanded={showChartTypeDropdown}
            aria-haspopup="listbox"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 16 16" fill="currentColor">
              {chartType === 'bar' ? (
                <>
                  <rect x="2" y="8" width="3" height="6" rx="0.5" />
                  <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
                  <rect x="11" y="6" width="3" height="8" rx="0.5" />
                </>
              ) : (
                <path
                  d="M2 12 L5 8 L8 10 L11 4 L14 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            <span className="capitalize">{chartType}</span>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          {showChartTypeDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowChartTypeDropdown(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                role="listbox"
              >
                <button
                  onClick={() => {
                    onChartTypeChange('bar')
                    setShowChartTypeDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-inset focus:bg-blue-50 flex items-center gap-2 ${chartType === 'bar' ? 'bg-blue-50 text-blue-600' : ''}`}
                  role="option"
                  aria-selected={chartType === 'bar'}
                  aria-label="Display charts as bar charts"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="2" y="8" width="3" height="6" rx="0.5" />
                    <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
                    <rect x="11" y="6" width="3" height="8" rx="0.5" />
                  </svg>
                  Bar
                </button>
                <button
                  onClick={() => {
                    onChartTypeChange('line')
                    setShowChartTypeDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-inset focus:bg-blue-50 flex items-center gap-2 ${chartType === 'line' ? 'bg-blue-50 text-blue-600' : ''}`}
                  role="option"
                  aria-selected={chartType === 'line'}
                  aria-label="Display charts as line charts"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                    <path
                      d="M2 12 L5 8 L8 10 L11 4 L14 6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Line
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Time Period Buttons - Scrollable on mobile */}
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
        role="group"
        aria-label="Time period selection"
      >
        {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => onTimePeriodChange(period)}
            className={`flex-shrink-0 px-4 md:px-5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] ${
              timePeriod === period
                ? 'bg-gray-900 text-white focus:ring-offset-2'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 focus:border-[#0066CC]'
            }`}
            aria-label={timePeriodLabels[period]}
            aria-pressed={timePeriod === period}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  )
}
