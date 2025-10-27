#!/bin/bash

# Fix AuthInitializer.tsx - remove AuthUser import
sed -i '' "s/import { AuthUser } from '@\/types';//g" src/components/AuthInitializer.tsx

# Fix BottomNavigation.tsx - remove User import and isOnTimerPage
sed -i '' 's/Trophy, User, Bell/Trophy, Bell/g' src/components/BottomNavigation.tsx
sed -i '' '/const isOnTimerPage =/d' src/components/BottomNavigation.tsx

# Fix ChallengeDetail.tsx - prefix onDelete with underscore
sed -i '' 's/onDelete?: /\_onDelete?: /g' src/components/ChallengeDetail.tsx

# Fix ChallengeLeaderboard.tsx - remove ChallengeLeaderboardEntry and User, prefix index
sed -i '' 's/ChallengeLeaderboardEntry, //g' src/components/ChallengeLeaderboard.tsx
sed -i '' 's/, User//g' src/components/ChallengeLeaderboard.tsx
sed -i '' 's/(participant, index)/(participant, _index)/g' src/components/ChallengeLeaderboard.tsx

# Fix CommentItem.tsx and CommentInput.tsx - prefix sessionId with underscore
sed -i '' 's/sessionId: string;/_sessionId: string;/g' src/components/CommentItem.tsx
sed -i '' 's/sessionId: string;/_sessionId: string;/g' src/components/CommentInput.tsx
sed -i '' 's/parentId?: string;/_parentId?: string;/g' src/components/CommentInput.tsx

# Fix CommentList.tsx - remove CommentWithDetails import and prefix initialCommentCount
sed -i '' "s/import { CommentWithDetails } from '@\/types';//g" src/components/CommentList.tsx
sed -i '' 's/initialCommentCount: number;/_initialCommentCount: number;/g' src/components/CommentList.tsx

# Fix ComparativeAnalytics.tsx - prefix userId
sed -i '' 's/userId: string;/_userId: string;/g' src/components/ComparativeAnalytics.tsx
sed -i '' 's/(point, index)/(point, _index)/g' src/components/ComparativeAnalytics.tsx

# Fix CreateChallengeModal.tsx - remove unused imports
sed -i '' 's/Badge, //g' src/components/CreateChallengeModal.tsx
sed -i '' '/^  Calendar,$/d' src/components/CreateChallengeModal.tsx
sed -i '' '/^  Users,$/d' src/components/CreateChallengeModal.tsx

echo "Fixed component files"
