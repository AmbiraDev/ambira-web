'use client';

import React, { useState, useEffect } from 'react';
import { ActivityData, WeeklyActivity, ProjectBreakdown } from '@/types';
import { firebaseUserApi } from '@/lib/api';
import { BarChart3, PieChart, TrendingUp, Clock, Target, Activity } from 'lucide-react';

interface ProfileStatsProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  userId, 
  isOwnProfile = false 
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'projects'>('daily');
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyActivity[]>([]);
  const [projectData, setProjectData] = useState<ProjectBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | 'year'>('30d');

  useEffect(() => {
    loadActivityData();
  }, [userId, selectedPeriod]);

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
      const year = new Date().getFullYear();
      const data = await firebaseUserApi.getUserDailyActivity(userId, year);
      setActivityData(data);
    } catch (error) {
      console.error('Failed to load activity data:', error);
      setActivityData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyData = async () => {
    try {
      setIsLoading(true);
      const data = await firebaseUserApi.getUserWeeklyActivity(userId, 12);
      setWeeklyData(data);
    } catch (error) {
      console.error('Failed to load weekly data:', error);
      setWeeklyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const year = new Date().getFullYear();
      const data = await firebaseUserApi.getUserProjectBreakdown(userId, year);
      setProjectData(data);
    } catch (error) {
      console.error('Failed to load project data:', error);
      setProjectData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const tabs = [
    { id: 'daily', label: 'Daily Activity', icon: Activity },
    { id: 'weekly', label: 'Weekly Trends', icon: BarChart3 },
    { id: 'projects', label: 'Project Breakdown', icon: PieChart },
  ];

  return (
    <div className="bg-card-background rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Activity Analytics
        </h2>
        
        {activeTab === 'daily' && (
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '30d' | '90d' | 'year')}
            className="px-3 py-1 border border-border rounded-md bg-background text-foreground"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="year">This Year</option>
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
          {activeTab === 'daily' && (
            <DailyActivityChart 
              data={activityData}
              selectedPeriod={selectedPeriod}
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
            <ProjectBreakdownChart 
              data={projectData}
              formatHours={formatHours}
            />
          )}
        </>
      )}
    </div>
  );
};

// Daily Activity Chart Component
interface DailyActivityChartProps {
  data: ActivityData[];
  selectedPeriod: '30d' | '90d' | 'year';
  formatHours: (hours: number) => string;
}

const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ 
  data,
  selectedPeriod,
  formatHours 
}) => {
  // Filter data based on selected period
  const getDaysCount = (period: '30d' | '90d' | 'year'): number => {
    if (period === '30d') return 30;
    if (period === '90d') return 90;
    return 365;
  };

  const daysCount = getDaysCount(selectedPeriod);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysCount);

  const filteredData = data
    .filter(d => {
      const date = new Date(d.date);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const maxHours = Math.max(...filteredData.map(d => d.hours), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate statistics
  const totalHours = filteredData.reduce((sum, d) => sum + d.hours, 0);
  const averageHours = filteredData.length > 0 ? totalHours / filteredData.length : 0;
  const activeDays = filteredData.filter(d => d.hours > 0).length;

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No activity data available for this period
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(totalHours)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Average/Day</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(averageHours)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Active Days</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {activeDays}
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Daily Activity Trend</h3>
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-muted-foreground w-12">
            <span>{formatHours(maxHours)}</span>
            <span>{formatHours(maxHours * 0.75)}</span>
            <span>{formatHours(maxHours * 0.5)}</span>
            <span>{formatHours(maxHours * 0.25)}</span>
            <span>0h</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-14 right-0 top-0 bottom-8">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-border" />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between gap-0.5">
              {filteredData.map((day, index) => {
                const height = (day.hours / maxHours) * 100;
                const isHovered = hoveredIndex === index;
                
                return (
                  <div
                    key={day.date}
                    className="relative flex-1 group"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div
                      className={`
                        w-full rounded-t transition-all duration-200
                        ${day.hours > 0 
                          ? isHovered 
                            ? 'bg-primary' 
                            : 'bg-primary/70 hover:bg-primary'
                          : 'bg-gray-100 border border-border'
                        }
                      `}
                      style={{ height: `${height}%` }}
                    />
                    
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
                        <div className="font-semibold">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div>{formatHours(day.hours)}</div>
                        <div className="opacity-70">{day.sessions} session{day.sessions !== 1 ? 's' : ''}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis */}
          <div className="absolute left-14 right-0 bottom-0 h-6 flex justify-between text-xs text-muted-foreground">
            {selectedPeriod === '30d' && filteredData.length > 0 && (
              <>
                <span>{new Date(filteredData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(filteredData[Math.floor(filteredData.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(filteredData[filteredData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </>
            )}
            {selectedPeriod === '90d' && filteredData.length > 0 && (
              <>
                <span>{new Date(filteredData[0].date).toLocaleDateString('en-US', { month: 'short' })}</span>
                <span>{new Date(filteredData[Math.floor(filteredData.length / 2)].date).toLocaleDateString('en-US', { month: 'short' })}</span>
                <span>{new Date(filteredData[filteredData.length - 1].date).toLocaleDateString('en-US', { month: 'short' })}</span>
              </>
            )}
            {selectedPeriod === 'year' && filteredData.length > 0 && (
              <>
                <span>Jan</span>
                <span>Apr</span>
                <span>Jul</span>
                <span>Oct</span>
                <span>Dec</span>
              </>
            )}
          </div>
        </div>
      </div>
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Parse week string (format: "2025-W40") to get a readable date range
  const getWeekLabel = (weekStr: string): string => {
    const [year, weekNum] = weekStr.split('-W');
    const weekNumber = parseInt(weekNum);
    
    // Get the first day of the week
    const firstDay = new Date(parseInt(year), 0, 1 + (weekNumber - 1) * 7);
    const dayOfWeek = firstDay.getDay();
    const diff = firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(firstDay.setDate(diff));
    
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeekRange = (weekStr: string): string => {
    const [year, weekNum] = weekStr.split('-W');
    const weekNumber = parseInt(weekNum);
    
    const firstDay = new Date(parseInt(year), 0, 1 + (weekNumber - 1) * 7);
    const dayOfWeek = firstDay.getDay();
    const diff = firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(firstDay.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Calculate statistics
  const totalHours = data.reduce((sum, w) => sum + w.hours, 0);
  const averageHours = data.length > 0 ? totalHours / data.length : 0;
  const bestWeek = data.reduce((max, w) => w.hours > max.hours ? w : max, data[0] || { hours: 0, week: '', sessions: 0 });

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No weekly data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(totalHours)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Last {data.length} weeks
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Avg/Week</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(averageHours)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Weekly average
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Best Week</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(bestWeek.hours)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {bestWeek.week && getWeekLabel(bestWeek.week)}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Activity Comparison</h3>
        <div className="relative h-80">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-muted-foreground w-12">
            <span>{formatHours(maxHours)}</span>
            <span>{formatHours(maxHours * 0.75)}</span>
            <span>{formatHours(maxHours * 0.5)}</span>
            <span>{formatHours(maxHours * 0.25)}</span>
            <span>0h</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-14 right-0 top-0 bottom-12">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-border" />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between gap-2">
              {data.map((week, index) => {
                const height = (week.hours / maxHours) * 100;
                const isHovered = hoveredIndex === index;
                
                return (
                  <div
                    key={week.week}
                    className="relative flex-1 group"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div
                      className={`
                        w-full rounded-t-lg transition-all duration-300
                        ${week.hours > 0 
                          ? isHovered 
                            ? 'bg-primary shadow-lg' 
                            : 'bg-primary/80 hover:bg-primary hover:shadow-lg'
                          : 'bg-gray-100 border border-border'
                        }
                      `}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-foreground text-background text-xs rounded-lg shadow-xl whitespace-nowrap z-10">
                        <div className="font-semibold">{getWeekRange(week.week)}</div>
                        <div className="mt-1">{formatHours(week.hours)}</div>
                        <div className="opacity-70">{week.sessions} session{week.sessions !== 1 ? 's' : ''}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-14 right-0 bottom-0 h-10 flex justify-between text-xs text-muted-foreground items-start pt-2">
            {data.map((week, index) => {
              // Show every other label for better readability
              if (data.length > 8 && index % 2 !== 0) return <div key={week.week} className="flex-1" />;
              
              return (
                <div key={week.week} className="flex-1 text-center">
                  <div>{getWeekLabel(week.week)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Project Breakdown Chart Component
interface ProjectBreakdownChartProps {
  data: ProjectBreakdown[];
  formatHours: (hours: number) => string;
}

const ProjectBreakdownChart: React.FC<ProjectBreakdownChartProps> = ({ data, formatHours }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No project data available
      </div>
    );
  }

  const totalHours = data.reduce((sum, p) => sum + p.hours, 0);
  const maxHours = Math.max(...data.map(p => p.hours));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <PieChart className="w-4 h-4" />
            <span className="text-sm font-medium">Total Projects</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {data.length}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(totalHours)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Top Project</span>
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {data[0]?.projectName}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatHours(data[0]?.hours)}
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Time Distribution by Project</h3>
        <div className="space-y-4">
          {data.map((project, index) => {
            const widthPercentage = (project.hours / maxHours) * 100;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={project.projectId}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {project.projectName}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatHours(project.hours)} ({project.percentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-100 rounded-full h-8 border border-border">
                    <div
                      className={`h-8 rounded-full transition-all duration-300 flex items-center justify-end pr-3 ${
                        isHovered ? 'shadow-lg' : 'shadow-sm'
                      }`}
                      style={{
                        width: `${widthPercentage}%`,
                        backgroundColor: project.color,
                        minWidth: widthPercentage > 0 ? '2%' : '0%',
                      }}
                    >
                      {widthPercentage > 20 && (
                        <span className="text-xs font-semibold text-white">
                          {project.percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hours
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((project, index) => (
              <tr
                key={project.projectId}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {project.projectName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground">
                  {formatHours(project.hours)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-muted-foreground">
                  {project.percentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
