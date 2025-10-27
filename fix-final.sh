#!/bin/bash

# Fix CommentsModal - formatTimeAgo already has underscore from linter
# (Nothing needed)

# Fix ComparativeAnalytics - selectedProjects and setSelectedProjects already fixed

# Fix DailyGoals - remove activitiesLoading
FILE="src/components/DailyGoals.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/, activitiesLoading//g' "$FILE"
  sed -i '' 's/activitiesLoading, //g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix LandingNavigation - prefix session and post
FILE="src/components/LandingNavigation.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/const \[session, post\]/const [_session, _post]/g' "$FILE"
  sed -i '' 's/const session = /const _session = /g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix PaginatedFeed - prefix initialLimit, err, updates
FILE="src/components/PaginatedFeed.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/initialLimit = /\_initialLimit = /g' "$FILE"
  sed -i '' 's/} catch (err) {/} catch (_err) {/g' "$FILE"
  sed -i '' 's/(updates: /(\_updates: /g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix ProfileFeed - remove suggestedUsers
FILE="src/components/ProfileFeed.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/const \[suggestedUsers,/const [_suggestedUsers,/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix ProfileStats - remove useCallback, Calendar imports, prefix isLoading
FILE="src/components/ProfileStats.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/useCallback, //g' "$FILE"
  sed -i '' 's/, useCallback//g' "$FILE"
  sed -i '' 's/Calendar, //g' "$FILE"
  sed -i '' 's/, Calendar//g' "$FILE"
  sed -i '' 's/\[isLoading,/[_isLoading,/g' "$FILE"
  sed -i '' 's/, isLoading/, _isLoading/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix GroupHeader - already fixed

# Fix GroupTabs - already fixed

# Fix LandingPage - remove LoginForm, SignupForm imports
FILE="src/components/LandingPage.tsx"
if [ -f "$FILE" ]; then
  sed -i '' "s/import { LoginForm } from '\.\/LoginForm';//g" "$FILE"
  sed -i '' "s/import { SignupForm } from '\.\/SignupForm';//g" "$FILE"
  echo "Fixed $FILE"
fi

# Fix ActivityAnalytics.tsx - prefix sessionsData
FILE="src/components/activity/ActivityAnalytics.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/const sessionsData = /const _sessionsData = /g' "$FILE"
  echo "Fixed $FILE"
fi

echo "All final fixes applied!"
