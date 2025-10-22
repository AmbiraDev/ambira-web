'use client';

import React from 'react';

interface HeatmapCalendarProps {
  data: Array<{ date: string; value: number }>; // date in YYYY-MM-DD format
  maxValue?: number;
  months?: number;
  colorScale?: string[];
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  data,
  maxValue,
  months = 12,
  colorScale = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
}) => {
  // Calculate max value if not provided
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  // Generate all days for the period
  const generateDays = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const days: Array<{ date: string; value: number; dayOfWeek: number; isToday: boolean }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = data.find(d => d.date === dateStr);

      days.push({
        date: dateStr,
        value: dayData?.value || 0,
        dayOfWeek: currentDate.getDay(),
        isToday: dateStr === todayStr
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const days = generateDays();

  // Group days by week
  const weeks: Array<Array<{ date: string; value: number; dayOfWeek: number; isToday: boolean }>> = [];
  let currentWeek: Array<{ date: string; value: number; dayOfWeek: number; isToday: boolean }> = [];

  days.forEach((day, index) => {
    if (index === 0 && day.dayOfWeek !== 0) {
      // Fill in empty days at the start
      for (let i = 0; i < day.dayOfWeek; i++) {
        currentWeek.push({ date: '', value: 0, dayOfWeek: i, isToday: false });
      }
    }

    currentWeek.push(day);

    if (day.dayOfWeek === 6 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColor = (value: number) => {
    if (value === 0) return colorScale[0];
    const percentage = value / max;
    if (percentage <= 0.25) return colorScale[1];
    if (percentage <= 0.5) return colorScale[2];
    if (percentage <= 0.75) return colorScale[3];
    return colorScale[4];
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 pr-2">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-3 flex items-center">
              {i % 2 === 1 && label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm transition-colors cursor-pointer ${
                      day.isToday
                        ? 'ring-2 ring-[#007AFF] ring-opacity-75 border-2 border-[#007AFF] font-bold'
                        : 'hover:ring-2 hover:ring-gray-400'
                    }`}
                    style={{ backgroundColor: day.date ? getColor(day.value) : 'transparent' }}
                    title={day.date ? `${day.date}: ${day.value} hours${day.isToday ? ' (Today)' : ''}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          {colorScale.map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
