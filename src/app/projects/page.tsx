'use client';

import React, { useState } from 'react';
import { ProjectList } from '@/components/ProjectList';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';

function ProjectsContent() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <ProjectList 
          onCreateProject={() => setShowCreateModal(true)}
        />
        
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(projectId) => {
            // Optionally redirect to the new project
            console.log('Created project:', projectId);
          }}
        />
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
