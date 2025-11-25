'use client'

import { useAuth } from '@/hooks/useAuth'
import DailyGoals from './DailyGoals'
import { StreakCard } from './StreakCard'

function LeftSidebar() {
  const { user } = useAuth()

  return (
    <aside className="hidden lg:block w-[340px] flex-shrink-0" aria-label="User sidebar">
      <div className="space-y-4 h-full overflow-y-auto scrollbar-hide pt-12 pb-6">
        {/* Streak Card */}
        {user && <StreakCard userId={user.id} variant="compact" showProgress={false} />}

        {/* Daily Goals */}
        <DailyGoals />
      </div>
    </aside>
  )
}

export default LeftSidebar
