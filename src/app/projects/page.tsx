'use client';

import React from 'react';
import { ProjectList } from '@/components/ProjectList';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';

function ProjectsContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <ProjectList />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}
