'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import HeaderComponent from '@/components/HeaderComponent';
import LeftSidebar from '@/components/LeftSidebar';
import { PersonalAnalyticsDashboard } from '@/components/PersonalAnalyticsDashboard';

const AnalyticsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <AnalyticsPageContent />
    </ProtectedRoute>
  );
};

const AnalyticsPageContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <LeftSidebar />
          
          <main className="flex-1 min-w-0">
            <PersonalAnalyticsDashboard userId={user.id} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
