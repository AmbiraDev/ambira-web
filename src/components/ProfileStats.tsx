'use client';

import React, { useState, useEffect } from 'react';
import { ActivityData, WeeklyActivity, ProjectBreakdown } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { Calendar, BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface ProfileStatsProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  userId, 
  isOwnProfile = false 
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'weekly' | 'projects'>('calendar');
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyActivity[]>([]);
  const [projectData, setProjectData] = useState<ProjectBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadActivityData();
  }, [userId, selectedYear]);

  useEffect(() => {
    if (activeTab === 'weekly') {
      loadWeeklyData();
    } else if (activeTab === 'projects') {
      loadProjectData();
    }
  }, [activeTab, userId]);

  const loadActivityData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement Firebase query for activity data
      // For now, we'll generate mock data until we implement the activity collection structure
      const mockData: ActivityData[] = [];
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const hours = Math.random() * 4; // Random hours 0-4
        mockData.push({
          date: dateStr,
          hours: hours,
          sessions: Math.floor(Math.random() * 3) + 1
        });
      }

      setActivityData(mockData);
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyData = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with real API call when backend is available
      const mockData: WeeklyActivity[] = [];
      for (let i = 0; i < 12; i++) {
        mockData.push({
          week: `W${i + 1}`,
          hours: Math.random() * 20 + 5,
          sessions: Math.floor(Math.random() * 10) + 3
        });
      }
      setWeeklyData(mockData);
    } catch (error) {
      console.error('Failed to load weekly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with real API call when backend is available
      const mockData: ProjectBreakdown[] = [
        { projectId: '1', projectName: 'Web Development', hours: 89.2, percentage: 57, color: '#007AFF' },
        { projectId: '2', projectName: 'Mobile App', hours: 45.8, percentage: 29, color: '#34C759' },
        { projectId: '3', projectName: 'Data Analysis', hours: 21.5, percentage: 14, color: '#FF9500' }
      ];
      setProjectData(mockData);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendarHeatmap = (data: ActivityData[]) => {
    // Create a map for quick lookup
    const dataMap = new Map(data.map(item => [item.date, item.hours]));
    
    // Generate all days for the year
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);
    const days: Array<{ date: string; hours: number; level: number }> = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const hours = dataMap.get(dateStr) || 0;
      const level = Math.min(4, Math.floor(hours / 2)); // 5 levels (0-4)
      days.push({ date: dateStr, hours, level });
    }
    
    return days;
  };

  const calendarDays = generateCalendarHeatmap(activityData);
  const maxHours = Math.max(...activityData.map(d => d.hours), 1);

  const getIntensityColor = (level: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800', // 0 hours
      'bg-green-200 dark:bg-green-900', // 1-2 hours
      'bg-green-300 dark:bg-green-700', // 2-4 hours
      'bg-green-400 dark:bg-green-600', // 4-6 hours
      'bg-green-500 dark:bg-green-500', // 6+ hours
    ];
    return colors[level] || colors[0];
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const tabs = [
    { id: 'calendar', label: 'Activity Calendar', icon: Calendar },
    { id: 'weekly', label: 'Weekly Overview', icon: BarChart3 },
    { id: 'projects', label: 'Project Breakdown', icon: PieChart },
  ];

  return (
    <div className="bg-card-background rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Activity Statistics
        </h2>
        
        {activeTab === 'calendar' && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1 border border-border rounded-md bg-background text-foreground"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-none border-b-2 transition-all
                ${activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {activeTab === 'calendar' && (
            <ActivityCalendar 
              days={calendarDays} 
              maxHours={maxHours}
              getIntensityColor={getIntensityColor}
              formatHours={formatHours}
            />
          )}

          {activeTab === 'weekly' && (
            <WeeklyChart 
              data={weeklyData}
              formatHours={formatHours}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectBreakdown 
              data={projectData}
              formatHours={formatHours}
            />
          )}
        </>
      )}
    </div>
  );
};

// Activity Calendar Component
interface ActivityCalendarProps {
  days: Array<{ date: string; hours: number; level: number }>;
  maxHours: number;
  getIntensityColor: (level: number) => string;
  formatHours: (hours: number) => string;
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ 
  days, 
  getIntensityColor, 
  formatHours 
}) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const getDayOfWeek = (date: Date): number => {
    return (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  };

  const weeks: Array<Array<{ date: string; hours: number; level: number }>> = [];
  let currentWeek: Array<{ date: string; hours: number; level: number }> = [];

  days.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = getDayOfWeek(date);
    
    // Start new week on Monday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    
    // Add empty days at the start of the year
    if (weeks.length === 0 && currentWeek.length === 0 && dayOfWeek > 0) {
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: '', hours: 0, level: 0 });
      }
    }
    
    currentWeek.push(day);
    
    // End of year - push remaining week
    if (index === days.length - 1) {
      weeks.push(currentWeek);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Activity Calendar - {days[0]?.date.split('-')[0]}</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2 text-xs text-muted-foreground">
            <div className="h-3"></div>
            <div className="h-3">M</div>
            <div className="h-3"></div>
            <div className="h-3">W</div>
            <div className="h-3"></div>
            <div className="h-3">F</div>
            <div className="h-3"></div>
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      w-3 h-3 rounded-sm cursor-pointer transition-all
                      ${day.date ? getIntensityColor(day.level) : 'bg-transparent'}
                      ${hoveredDay === day.date ? 'ring-2 ring-primary ring-opacity-50' : ''}
                    `}
                    onMouseEnter={() => day.date && setHoveredDay(day.date)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={day.date ? `${day.date}: ${formatHours(day.hours)}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hoveredDay && (
        <div className="text-sm text-muted-foreground">
          {hoveredDay}: {formatHours(days.find(d => d.date === hoveredDay)?.hours || 0)}
        </div>
      )}
    </div>
  );
};

// Weekly Chart Component
interface WeeklyChartProps {
  data: WeeklyActivity[];
  formatHours: (hours: number) => string;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, formatHours }) => {
  const maxHours = Math.max(...data.map(d => d.hours), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-2">
        {data.map((week, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-sm relative h-32 flex items-end">
              <div
                className="w-full bg-primary rounded-t-sm transition-all duration-300"
                style={{ height: `${(week.hours / maxHours) * 100}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {formatHours(week.hours)}
            </div>
            <div className="text-xs text-muted-foreground">
              W{index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Project Breakdown Component
interface ProjectBreakdownProps {
  data: ProjectBreakdown[];
  formatHours: (hours: number) => string;
}

const ProjectBreakdown: React.FC<ProjectBreakdownProps> = ({ data, formatHours }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No project data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple bar chart representation */}
        <div className="space-y-3">
          {data.map((project) => (
            <div key={project.projectId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{project.projectName}</span>
                <span className="text-muted-foreground">{formatHours(project.hours)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${project.percentage}%`,
                    backgroundColor: project.color 
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {project.percentage.toFixed(1)}% of total time
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-3">Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Projects:</span>
              <span className="font-medium">{data.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Hours:</span>
              <span className="font-medium">
                {formatHours(data.reduce((sum, p) => sum + p.hours, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top Project:</span>
              <span className="font-medium">{data[0]?.projectName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
