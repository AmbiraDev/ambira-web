#!/bin/bash

# Script to complete the projects -> activities refactor
# Run from project root: bash scripts/finish-activity-refactor.sh

set -e

echo "🔧 Finishing Activity Refactor..."

# 1. Update all "Project" text to "Activity" in dropdowns/labels in SessionTimerEnhanced
sed -i '' 's/Project Selection/Activity Selection/g' src/components/SessionTimerEnhanced.tsx
sed -i '' 's/<span className="text-xs text-gray-600 font-medium">Project<\/span>/<span className="text-xs text-gray-600 font-medium">Activity<\/span>/g' src/components/SessionTimerEnhanced.tsx

# 2. Update projects.map to allActivities.map in select dropdowns
sed -i '' 's/{projects\.map((project) =>/{allActivities.map((activity) =>/g' src/components/SessionTimerEnhanced.tsx
sed -i '' 's/<option key={project\.id} value={project\.id}>/<option key={activity.id} value={activity.id}>/g' src/components/SessionTimerEnhanced.tsx
sed -i '' 's/{project\.icon} {project\.name}/{activity.icon} {activity.name}/g' src/components/SessionTimerEnhanced.tsx

# 3. Update "Project:" display in session summary
sed -i '' 's/Project: {projects\.find/Activity: {allActivities.find/g' src/components/SessionTimerEnhanced.tsx
sed -i '' 's/\.find(p => p\.id === selectedActivityId)/\.find(a => a.id === selectedActivityId)/g' src/components/SessionTimerEnhanced.tsx

echo "✅ SessionTimerEnhanced updated!"

# 4. Update navigation if /projects exists, create /activities route
if [ -d "src/app/projects" ]; then
  echo "📁 Creating /activities route..."
  cp -r src/app/projects src/app/activities 2>/dev/null || true
fi

echo "✨ Refactor complete! Next steps:"
echo "1. Manually remove tag UI sections from SessionTimerEnhanced.tsx (lines ~363, 670, 747, 875, 898, 996)"
echo "2. Test timer functionality"
echo "3. Update navigation links from /projects to /activities"
echo "4. Run: npm run type-check"
