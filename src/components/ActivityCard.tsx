'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Activity, ActivityStats } from '@/types';
import { useProjects } from '@/contexts/ProjectsContext';
import { useToast } from '@/contexts/ToastContext';
import { IconRenderer } from '@/components/IconRenderer';

interface ActivityCardProps {
  activity: Activity;
  stats?: ActivityStats;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
  onArchive?: (activity: Activity) => void;
}

// Minimum card height ensures consistent layout in grid view
// Accommodates icon, title, description, and progress bars without content jumping
const CARD_MIN_HEIGHT = 280; // pixels

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  stats,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activityStats, setActivityStats] = useState<ActivityStats | undefined>(stats);
  const { getProjectStats } = useProjects();
  const toast = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Load stats if not provided
  React.useEffect(() => {
    if (!stats && !activityStats) {
      loadStats();
    }
  }, [activity.id]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      if (getProjectStats) {
        const fetchedStats = await getProjectStats(activity.id);
        setActivityStats(fetchedStats);
      }
    } catch (error) {
      console.error('Failed to load activity stats:', error);
      toast.error('Failed to load activity statistics. Please refresh the page.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const currentStats = stats || activityStats;

  // Consolidated color mapping with both Tailwind classes and hex values
  // Tailwind classes are used for progress bars, hex values for icon backgrounds
  const colorMap: Record<string, { tailwind: string; hex: string }> = {
    orange: { tailwind: 'bg-orange-500', hex: '#f97316' },
    blue: { tailwind: 'bg-blue-500', hex: '#3b82f6' },
    green: { tailwind: 'bg-green-500', hex: '#22c55e' },
    purple: { tailwind: 'bg-purple-500', hex: '#a855f7' },
    red: { tailwind: 'bg-red-500', hex: '#ef4444' },
    yellow: { tailwind: 'bg-yellow-500', hex: '#eab308' },
    pink: { tailwind: 'bg-pink-500', hex: '#ec4899' },
    indigo: { tailwind: 'bg-indigo-500', hex: '#6366f1' },
    teal: { tailwind: 'bg-teal-500', hex: '#14b8a6' },
    cyan: { tailwind: 'bg-cyan-500', hex: '#06b6d4' },
    lime: { tailwind: 'bg-lime-500', hex: '#84cc16' },
    amber: { tailwind: 'bg-amber-500', hex: '#f59e0b' },
    emerald: { tailwind: 'bg-emerald-500', hex: '#10b981' },
    violet: { tailwind: 'bg-violet-500', hex: '#8b5cf6' },
    fuchsia: { tailwind: 'bg-fuchsia-500', hex: '#d946ef' },
    rose: { tailwind: 'bg-rose-500', hex: '#f43f5e' },
    sky: { tailwind: 'bg-sky-500', hex: '#0ea5e9' },
    slate: { tailwind: 'bg-slate-500', hex: '#64748b' },
  };

  const colorClass = colorMap[activity.color]?.tailwind || 'bg-gray-500';

  // Get the actual color value (hex or fallback to name)
  const getColorValue = (color: string): string => {
    // If it's already a hex color, return it
    if (color.startsWith('#')) return color;
    // Otherwise, try to find the hex value from the consolidated map
    return colorMap[color]?.hex || color;
  };

  const colorValue = getColorValue(activity.color);

  // Calculate progress percentage
  const weeklyProgress = activity.weeklyTarget ? ((currentStats?.weeklyHours || 0) / activity.weeklyTarget) * 100 : 0;
  const totalProgress = activity.totalTarget ? ((currentStats?.totalHours || 0) / activity.totalTarget) * 100 : 0;

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  // Keyboard handler for menu toggle button
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setShowMenu(!showMenu);
    } else if (e.key === 'Escape' && showMenu) {
      e.preventDefault();
      e.stopPropagation();
      setShowMenu(false);
    }
  };

  // Keyboard handler for menu items
  const handleMenuItemKeyDown = (e: React.KeyboardEvent, action: () => void, index: number, totalItems: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      action();
      setShowMenu(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowMenu(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Focus next menu item
      const nextIndex = (index + 1) % totalItems;
      const menuItems = menuRef.current?.querySelectorAll('button');
      if (menuItems?.[nextIndex]) {
        (menuItems[nextIndex] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Focus previous menu item
      const prevIndex = index === 0 ? totalItems - 1 : index - 1;
      const menuItems = menuRef.current?.querySelectorAll('button');
      if (menuItems?.[prevIndex]) {
        (menuItems[prevIndex] as HTMLElement).focus();
      }
    }
  };

  return (
    <div className="bg-transparent rounded-xl border border-gray-200/60 hover:border-gray-300 hover:shadow-sm transition-all duration-200 relative group h-full flex flex-col">
      <Link href={`/activities/${activity.id}`} className="block p-6 flex-1 flex flex-col" style={{ minHeight: `${CARD_MIN_HEIGHT}px` }}>
        {/* Header with icon and menu */}
        <div className="flex items-start justify-between mb-5 flex-shrink-0">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center p-2 shadow-sm"
            style={{ backgroundColor: colorValue }}
          >
            <IconRenderer iconName={activity.icon} size={40} />
          </div>
          <button
            onClick={handleMenuToggle}
            onKeyDown={handleMenuKeyDown}
            aria-label="Open activity menu"
            aria-expanded={showMenu}
            aria-haspopup="true"
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Activity info */}
        <div className="mb-5 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed min-h-[2.5rem]">{activity.description}</p>
        </div>

        {/* Progress indicators */}
        <div className="flex-1 flex flex-col justify-end">
        {isLoadingStats ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-2.5 bg-gray-200 rounded-full w-3/4"></div>
            </div>
          </div>
        ) : currentStats ? (
          <div className="space-y-4">
            {/* Weekly progress */}
            {activity.weeklyTarget && (
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
                  <span>This week</span>
                  <span className="text-gray-900">{(currentStats.weeklyHours || 0).toFixed(1)}h / {activity.weeklyTarget}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    role="progressbar"
                    aria-valuenow={Math.min(100, Math.round(weeklyProgress))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Weekly progress: ${(currentStats.weeklyHours || 0).toFixed(1)} hours of ${activity.weeklyTarget} hours`}
                    className={`${colorClass} h-2.5 rounded-full motion-safe:transition-all motion-safe:duration-300 shadow-sm`}
                    style={{ width: `${Math.min(100, weeklyProgress)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Total progress */}
            {activity.totalTarget && (
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
                  <span>Total</span>
                  <span className="text-gray-900">{(currentStats.totalHours || 0).toFixed(1)}h / {activity.totalTarget}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    role="progressbar"
                    aria-valuenow={Math.min(100, Math.round(totalProgress))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Total progress: ${(currentStats.totalHours || 0).toFixed(1)} hours of ${activity.totalTarget} hours`}
                    className={`${colorClass} h-2.5 rounded-full motion-safe:transition-all motion-safe:duration-300 shadow-sm`}
                    style={{ width: `${Math.min(100, totalProgress)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No targets set
          </div>
        )}
        </div>
      </Link>

      {/* Dropdown menu */}
      {showMenu && (
        <div ref={menuRef} role="menu" className="absolute top-16 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
          <button
            onClick={(e) => handleAction(e, () => onEdit?.(activity))}
            onKeyDown={(e) => handleMenuItemKeyDown(e, () => onEdit?.(activity), 0, 3)}
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Edit
          </button>
          {activity.status === 'active' ? (
            <button
              onClick={(e) => handleAction(e, () => onArchive?.(activity))}
              onKeyDown={(e) => handleMenuItemKeyDown(e, () => onArchive?.(activity), 1, 3)}
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Archive
            </button>
          ) : (
            <button
              onClick={(e) => handleAction(e, () => onArchive?.(activity))}
              onKeyDown={(e) => handleMenuItemKeyDown(e, () => onArchive?.(activity), 1, 3)}
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Restore
            </button>
          )}
          <div className="my-1 border-t border-gray-100"></div>
          <button
            onClick={(e) => handleAction(e, () => onDelete?.(activity))}
            onKeyDown={(e) => handleMenuItemKeyDown(e, () => onDelete?.(activity), 2, 3)}
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
