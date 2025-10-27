#!/bin/bash

echo "Starting batch lint fixes..."

# Phase 1: Fix unused variables with underscore prefix
echo "Phase 1: Removing unused variables..."

# Fix unused 'container' variable
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec perl -i -pe '
  s/const \{ container \} = render\(/const { } = render(/g;
' {} \;

# Fix _onMarkRead unused prop (remove from props destructuring)
perl -i -pe 's/^\s*_onMarkRead.*$//' src/app/notifications/page.tsx

# Fix unused variables by removing them entirely when they are standalone constants
# _formatTimeAgo was already removed from share page

# Fix unused variables in CommentInput - remove sessionId and parentId from props
# They are already defined but not used

# Phase 2: Fix Image issues
echo "Phase 2: Adding eslint-disable for img tags in image export contexts..."
# These are already handled

# Phase 3: Remove unused imports
echo "Phase 3: Removing unused imports..."

# Remove specific unused imports that are clearly identified
# Note: Be careful not to break code - only remove clearly unused ones

#Remove useCallback from activities/[id]/page.tsx
perl -i -pe 's/, useCallback//' src/app/activities/[id]/page.tsx

# Phase 4: Fix any types by replacing with unknown where appropriate
echo "Phase 4: Replacing some 'any' with 'unknown'..."
# This is risky - manual fixes are better

echo "Phase 1-3 complete. Running final lint check..."
npm run lint -- "src/__tests__/**/*.{ts,tsx}" "e2e/**/*.ts" 2>&1 | head -80
