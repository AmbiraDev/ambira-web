'use client';

import React, { useState } from 'react';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { ActivityChart } from './ActivityChart';

interface ComparativeAnalyticsProps {
  userId: string;
}

export const ComparativeAnalytics: React.FC<ComparativeAnalyticsProps> = ({
  userId,
}) => {
  const [_selectedProjects, _setSelectedProjects] = useState<string[]>([]);

  // Mock data
  const mockData = {
    projects: [
      {
        projectId: '1',
        projectName: 'Web Development',
        hours: 45,
        sessions: 28,
        tasks: 156,
      },
      {
        projectId: '2',
        projectName: 'Mobile App',
        hours: 32,
        sessions: 20,
        tasks: 98,
      },
      {
        projectId: '3',
        projectName: 'Design Work',
        hours: 28,
        sessions: 18,
        tasks: 67,
      },
    ],
    weekOverWeek: [
      { week: 'Week 1', hours: 35, change: 0 },
      { week: 'Week 2', hours: 38, change: 8.6 },
      { week: 'Week 3', hours: 42, change: 10.5 },
      { week: 'Week 4', hours: 45, change: 7.1 },
    ],
    personalRecords: {
      longestSession: {
        duration: 240,
        date: new Date('2025-09-15'),
        projectName: 'Web Development',
      },
      mostProductiveDay: {
        hours: 12,
        date: new Date('2025-09-20'),
        sessions: 8,
      },
      bestWeek: { hours: 52, weekStart: new Date('2025-09-01'), sessions: 32 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Comparative Analytics
        </h2>
        <p className="text-gray-600">
          Compare projects and track your progress over time
        </p>
      </div>

      {/* Project comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Project Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Project
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Hours
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Sessions
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Tasks
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Avg Session
                </th>
              </tr>
            </thead>
            <tbody>
              {mockData.projects.map((project, index) => (
                <tr
                  key={project.projectId}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? 'bg-blue-500'
                            : index === 1
                              ? 'bg-green-500'
                              : 'bg-purple-500'
                        }`}
                      />
                      <span className="font-medium text-gray-900">
                        {project.projectName}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-semibold text-gray-900">
                    {project.hours}h
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">
                    {project.sessions}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">
                    {project.tasks}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">
                    {(project.hours / project.sessions).toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual comparison */}
        <div className="mt-6">
          <ActivityChart
            data={mockData.projects.map(p => ({
              label: p.projectName,
              value: p.hours,
              secondaryValue: p.sessions,
            }))}
            type="bar"
            height={200}
            valueFormatter={v => `${v}h`}
          />
        </div>
      </div>

      {/* Week over week */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Week-over-Week Progress
        </h3>

        <ActivityChart
          data={mockData.weekOverWeek.map(w => ({
            label: w.week,
            value: w.hours,
          }))}
          type="line"
          height={200}
          color="#3b82f6"
          valueFormatter={v => `${v}h`}
        />

        <div className="mt-4 grid grid-cols-4 gap-4">
          {mockData.weekOverWeek.map((week, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">{week.week}</p>
              <p className="text-lg font-bold text-gray-900">{week.hours}h</p>
              {week.change !== 0 && (
                <p
                  className={`text-xs font-medium ${week.change > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {week.change > 0 ? '+' : ''}
                  {week.change.toFixed(1)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personal records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">Longest Session</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600 mb-1">
            {Math.floor(mockData.personalRecords.longestSession.duration / 60)}h{' '}
            {mockData.personalRecords.longestSession.duration % 60}m
          </p>
          <p className="text-sm text-gray-600">
            {mockData.personalRecords.longestSession.projectName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {mockData.personalRecords.longestSession.date.toLocaleDateString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Most Productive Day</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            {mockData.personalRecords.mostProductiveDay.hours}h
          </p>
          <p className="text-sm text-gray-600">
            {mockData.personalRecords.mostProductiveDay.sessions} sessions
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {mockData.personalRecords.mostProductiveDay.date.toLocaleDateString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Best Week</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {mockData.personalRecords.bestWeek.hours}h
          </p>
          <p className="text-sm text-gray-600">
            {mockData.personalRecords.bestWeek.sessions} sessions
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Week of{' '}
            {mockData.personalRecords.bestWeek.weekStart.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Productivity patterns */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Productivity Patterns
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Time of Day
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Morning (6-12)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: '65%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Afternoon (12-18)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Evening (18-24)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: '45%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">45%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Day of Week
            </h4>
            <div className="space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
                (day, index) => {
                  const percentage = 60 + Math.random() * 30;
                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">{day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
