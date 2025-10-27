#!/bin/bash

echo "Final comprehensive lint fixes..."

# Remove unused underscore-prefixed variables that are clearly unused
# This uses a more careful approach - only removing entire const declarations

# Fix ChallengeLeaderboard - remove unused 'index' parameter
perl -i -pe 's/\.map\(\(([^,]+), index\) =>/\.map\((\1, _index) =>/' src/components/ChallengeLeaderboard.tsx

# Fix CommentInput - remove _handleCancel
perl -i -pe 's/^.*const _handleCancel.*$//g' src/components/CommentInput.tsx

# Fix CommentsModal - remove _formatTimeAgo function
# This requires finding and removing the entire function block - skip for safety

# Fix ComparativeAnalytics - remove unused props and state
perl -i -pe 's/\{ _userId, /\{ /' src/components/ComparativeAnalytics.tsx
perl -i -pe 's/const \[_selectedProjects, _setSelectedProjects\].*$//' src/components/ComparativeAnalytics.tsx

# Fix DataExport - remove unused _error catch variable
perl -i -pe 's/catch \(_error\)/catch/' src/components/DataExport.tsx

# Fix EditProfileModal - remove unused profile visibility state
perl -i -pe 's/const \[_profileVisibility, _setProfileVisibility\].*$//' src/components/EditProfileModal.tsx

echo "Fixes applied. Final lint check:"
npm run lint -- "src/__tests__/**/*.{ts,tsx}" "e2e/**/*.ts" 2>&1 | tail -5
