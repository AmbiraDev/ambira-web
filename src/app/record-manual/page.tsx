'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import ManualSessionRecorder from '@/components/ManualSessionRecorder'

export default function RecordManualPage() {
  return (
    <ProtectedRoute>
      <ManualSessionRecorder />
    </ProtectedRoute>
  )
}
