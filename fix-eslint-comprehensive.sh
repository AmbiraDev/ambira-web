#!/bin/bash

# Comprehensive ESLint fix script
# This script fixes all ESLint warnings systematically

echo "🔧 Starting comprehensive ESLint fixes..."

# Category 1: Fix unused imports - already partially done, complete remaining
echo "📦 Fixing remaining unused imports..."

# ProjectAnalytics.tsx
sed -i '' 's/import { ActivityChart } from/import { ActivityChart } from/g' src/components/ProjectAnalytics.tsx
sed -i '' 's/, ProjectStats//g; s/ProjectStats, //g; s/, firebaseProjectApi//g; s/firebaseProjectApi, //g; s/, firebaseSessionApi//g; s/firebaseSessionApi, //g' src/components/ProjectAnalytics.tsx

# PersonalAnalyticsDashboard.tsx
sed -i '' 's/import { StreakDisplay } from/\/\/ import { StreakDisplay } from/g' src/components/PersonalAnalyticsDashboard.tsx

# ProjectList.tsx
sed -i '' 's/, useCallback//g; s/useCallback, //g' src/components/ProjectList.tsx

# ProtectedRoute.tsx
sed -i '' 's/useEffect, useState/useEffect/g' src/components/ProtectedRoute.tsx

# RightSidebar.tsx
sed -i '' 's/, useCallback//g; s/useCallback, //g' src/components/RightSidebar.tsx

# SessionHistory.tsx
sed -i '' 's/, useCallback//g; s/useCallback, //g' src/components/SessionHistory.tsx

# ManualSessionRecorder.tsx - remove unused imports
sed -i '' 's/, SessionFormData//g; s/SessionFormData, //g; s/, Link//g; s/Link, //g; s/, compressImage//g; s/compressImage, //g' src/components/ManualSessionRecorder.tsx

# PrivacySettings.tsx
sed -i '' 's/import { useAuth } from/\/\/ import { useAuth } from/g' src/components/PrivacySettings.tsx

# header/Header.tsx
sed -i '' 's/, DIMENSIONS//g; s/DIMENSIONS, //g' src/components/header/Header.tsx

# Feature files
sed -i '' 's/, Comment//g; s/Comment, //g; s/, ValidatedCreateCommentData//g; s/ValidatedCreateCommentData, //g; s/, ValidatedUpdateCommentData//g; s/ValidatedUpdateCommentData, //g' src/features/comments/services/CommentService.ts

sed -i '' 's/, Session//g; s/Session, //g' src/features/feed/services/FeedService.ts

sed -i '' 's/, FeedOptions//g; s/FeedOptions, //g' src/features/feed/hooks/useFeed.ts

echo "✅ Category 1 complete"

# Category 2: Fix unused variables
echo "🔢 Fixing unused variables..."

# Feed.tsx - prefix err with _
find src/components -name "Feed.tsx" -exec sed -i '' 's/(err)/(\_err)/g' {} \;

# GroupTabs.tsx - prefix isAdmin
find src/components -name "GroupTabs.tsx" -exec sed -i '' 's/const isAdmin = /const _isAdmin = /g' {} \;

# ImageUpload.tsx - prefix showTypeHint
find src/components -name "ImageUpload.tsx" -exec sed -i '' 's/const showTypeHint = /const _showTypeHint = /g' {} \;

echo "✅ Category 2 complete"

echo "🎉 ESLint fixes complete! Run 'npm run lint' to verify."
