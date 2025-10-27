'use client';

import React from 'react';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';

export default function TimerPageContent() {
  return (
    <main id="timer-content" className="md:pt-20">
      <SessionTimerEnhanced projectId="" />
    </main>
  );
}
