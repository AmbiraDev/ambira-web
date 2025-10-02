'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ManualEntry } from './ManualEntry';
import { mockSessionApi, authApi } from '@/lib/api';
import { mockSessionApi as mockSessionApiLocal } from '@/lib/mockApi';

export const FABMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get auth token
  const getAuthToken = (): string => {
    const token = authApi.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
    setIsOpen(false);
  };

  const handleSaveSession = async (data: any) => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      await mockSessionApiLocal.createSession(data, token);
      setShowManualEntry(false);
      // You could add a toast notification here
      console.log('Session saved successfully!');
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button Menu */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Menu Items */}
        <div className={`absolute bottom-16 right-0 mb-2 space-y-2 transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}>
          {/* Manual Entry */}
          <button
            onClick={handleManualEntry}
            className="flex items-center space-x-3 bg-white text-gray-700 px-4 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium">Manual Entry</span>
          </button>

          {/* Session History */}
          <Link
            href="/sessions"
            className="flex items-center space-x-3 bg-white text-gray-700 px-4 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-medium">Session History</span>
          </Link>

          {/* Timer */}
          <Link
            href="/timer"
            className="flex items-center space-x-3 bg-white text-gray-700 px-4 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-medium">Start Timer</span>
          </Link>
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <ManualEntry
          onSave={handleSaveSession}
          onCancel={() => setShowManualEntry(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
