'use client';

import React, { useState } from 'react';
import { Download, Calendar, FileText, Database } from 'lucide-react';

interface DataExportProps {
  userId: string;
}

export const DataExport: React.FC<DataExportProps> = ({ userId }) => {
  const [exportType, setExportType] = useState<
    'sessions' | 'projects' | 'tasks' | 'all'
  >('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [includePrivate, setIncludePrivate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Preparing your export...');

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, call API:
      // await firebaseApi.analytics.exportData({
      //   type: exportType,
      //   dateFrom: new Date(dateFrom),
      //   dateTo: new Date(dateTo),
      //   format,
      //   includePrivate
      // });

      setExportStatus(
        'Export complete! Check your email for the download link.'
      );
    } catch (_error) {
      setExportStatus('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  };

  const defaults = getDefaultDates();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Export Data</h2>
          <p className="text-sm text-gray-600">
            Download your productivity data
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Export type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What to export
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'all', label: 'Everything', icon: Database },
              { value: 'sessions', label: 'Sessions', icon: Calendar },
              { value: 'projects', label: 'Projects', icon: FileText },
              { value: 'tasks', label: 'Tasks', icon: FileText },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setExportType(value as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  exportType === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${exportType === value ? 'text-blue-600' : 'text-gray-400'}`}
                />
                <span
                  className={`text-sm font-medium ${exportType === value ? 'text-blue-600' : 'text-gray-700'}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom || defaults.from}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo || defaults.to}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Format
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                format === 'csv'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">CSV</span>
              <p className="text-xs mt-1">Excel compatible</p>
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                format === 'json'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">JSON</span>
              <p className="text-xs mt-1">Developer friendly</p>
            </button>
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={e => setIncludePrivate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Include private sessions and notes
            </span>
          </label>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          {isExporting ? 'Exporting...' : 'Export Data'}
        </button>

        {/* Status message */}
        {exportStatus && (
          <div
            className={`p-4 rounded-lg ${
              exportStatus.includes('failed')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            <p className="text-sm">{exportStatus}</p>
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> For security reasons, we'll email you a
            download link instead of downloading directly. The link will expire
            after 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
};
