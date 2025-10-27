#!/bin/bash

# Fix CommentsModal.tsx - remove formatTimeAgo
FILE="src/components/CommentsModal.tsx"
if [ -f "$FILE" ]; then
  # Remove the formatTimeAgo function definition
  perl -i -p0e 's/const formatTimeAgo = \(date: Date\): string => \{[^}]+\};//gs' "$FILE"
  echo "Fixed $FILE"
fi

# Fix DailyGoals.tsx - remove activitiesLoading
FILE="src/components/DailyGoals.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/, activitiesLoading//g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix EducatedGuessTable.tsx - prefix userId
FILE="src/components/EducatedGuessTable.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/userId: string;/_userId: string;/g' "$FILE"
  sed -i '' 's/{ userId }/{ _userId }/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix FileUpload.tsx - prefix error
FILE="src/components/FileUpload.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/) catch (error) {/) catch (_error) {/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix GroupMemberModal.tsx - remove useEffect, prefix error
FILE="src/components/GroupMemberModal.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/useEffect, //g' "$FILE"
  sed -i '' 's/) catch (error) {/) catch (_error) {/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix HeaderComponent.tsx - remove XCircle
FILE="src/components/HeaderComponent.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/XCircle, //g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix LandingNavigation.tsx - remove unused vars
FILE="src/components/LandingNavigation.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/const \[session, post\] = /const [_session, _post] = /g' "$FILE"
  sed -i '' 's/const session = /const _session = /g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix PaginatedFeed.tsx - prefix initialLimit, err
FILE="src/components/PaginatedFeed.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/initialLimit = /\_initialLimit = /g' "$FILE"
  sed -i '' 's/) catch (err) {/) catch (_err) {/g' "$FILE"
  sed -i '' 's/updates: /\_updates: /g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix PostInteractions.tsx - remove handleSwipe
FILE="src/components/PostInteractions.tsx"
if [ -f "$FILE" ]; then
  perl -i -p0e 's/const handleSwipe = \([^)]+\) => \{[^}]+\};//gs' "$FILE"
  echo "Fixed $FILE"
fi

# Fix ProfileFeed.tsx - remove suggestedUsers, handleFeedTypeChange
FILE="src/components/ProfileFeed.tsx"
if [ -f "$FILE" ]; then
  sed -i '' '/const \[suggestedUsers, /d' "$FILE"
  perl -i -p0e 's/const handleFeedTypeChange = \([^)]+\) => \{[^}]+\};//gs' "$FILE"
  echo "Fixed $FILE"
fi

# Fix ProfileStats.tsx - remove unused Lucide imports
FILE="src/components/ProfileStats.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/BarChart3, //g' "$FILE"
  sed -i '' 's/, Users//g' "$FILE"
  sed -i '' 's/, Clock//g' "$FILE"
  sed -i '' 's/, Calendar//g' "$FILE"
  sed -i '' 's/  Legend,//g' "$FILE"
  sed -i '' '/const .* isLoading .* = /s/isLoading, /\_isLoading, /g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix ProjectAnalytics.tsx - remove unused imports
FILE="src/components/ProjectAnalytics.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/  Target,//g' "$FILE"
  sed -i '' 's/  Calendar,//g' "$FILE"
  sed -i '' 's/  Users,//g' "$FILE"
  sed -i '' 's/  TrendingUp,//g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix GroupDetail.tsx - remove unused imports
FILE="src/app/groups/[id]/page.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/Image, //g' "$FILE"
  sed -i '' 's/Button, //g' "$FILE"
  sed -i '' 's/Badge, //g' "$FILE"
  sed -i '' 's/  Calendar,//g' "$FILE"
  sed -i '' 's/  MoreHorizontal,//g' "$FILE"
  sed -i '' 's/  Target,//g' "$FILE"
  sed -i '' 's/  ArrowLeft,//g' "$FILE"
  sed -i '' 's/) catch (err) {/) catch (_err) {/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix GroupSettings.tsx - remove unused imports
FILE="src/components/GroupSettings.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/Select, //g' "$FILE"
  sed -i '' 's/Switch, //g' "$FILE"
  sed -i '' 's/  Settings,//g' "$FILE"
  sed -i '' 's/  Users,//g' "$FILE"
  sed -i '' 's/  Upload,//g' "$FILE"
  sed -i '' 's/  X,//g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix GroupHeader.tsx - remove unused vars
FILE="src/components/GroupHeader.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/Button, //g' "$FILE"
  sed -i '' 's/  ChevronDown,//g' "$FILE"
  sed -i '' 's/groupId: string;/_groupId: string;/g' "$FILE"
  sed -i '' 's/isAdmin: boolean/_isAdmin: boolean/g' "$FILE"
  sed -i '' 's/const \[isMobileMenuOpen, setIsMobileMenuOpen\]/const [_isMobileMenuOpen, _setIsMobileMenuOpen]/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix GroupTabs.tsx - prefix showTypeHint
FILE="src/components/GroupTabs.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/showTypeHint: boolean/_showTypeHint: boolean/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix LandingPage.tsx - remove unused vars
FILE="src/components/LandingPage.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/const { user, isAuthenticated, isLoading: authIsLoading }/const { user: _user, isAuthenticated: _isAuthenticated, isLoading: _authIsLoading }/g' "$FILE"
  perl -i -p0e 's/const handleLoginWithEmail = \([^)]+\) => \{[^}]+\};//gs' "$FILE"
  sed -i '' 's/) catch (error) {/) catch (_error) {/g' "$FILE"
  sed -i '' 's/const \[carouselIndex, setCarouselIndex\]/const [_carouselIndex, _setCarouselIndex]/g' "$FILE"
  perl -i -p0e 's/const benefits = \[[^\]]+\];//gs' "$FILE"
  echo "Fixed $FILE"
fi

# Fix UnifiedProfileCard.tsx - remove unused imports
FILE="src/components/UnifiedProfileCard.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/WeekStreakCalendar, //g' "$FILE"
  sed -i '' 's/ChevronRight, //g' "$FILE"
  sed -i '' "s/import Link from 'next\/link';//g" "$FILE"
  sed -i '' "s/import Image from 'next\/image';//g" "$FILE"
  sed -i '' 's/const \[profile\]/const [_profile]/g' "$FILE"
  sed -i '' 's/const \[stats\]/const [_stats]/g' "$FILE"
  sed -i '' 's/const \[isLoading\]/const [_isLoading]/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix SessionCard.tsx - prefix totalLikes, error
FILE="src/components/SessionCard.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/totalLikes: number/_totalLikes: number/g' "$FILE"
  sed -i '' 's/) catch (error) {/) catch (_error) {/g' "$FILE"
  echo "Fixed $FILE"
fi

# Fix SessionPrompt.tsx - remove token
FILE="src/components/SessionPrompt.tsx"
if [ -f "$FILE" ]; then
  sed -i '' '/const token = /d' "$FILE"
  echo "Fixed $FILE"
fi

# Fix SaveSession.tsx - remove unused imports and vars
FILE="src/components/SaveSession.tsx"
if [ -f "$FILE" ]; then
  sed -i '' 's/SessionFormData, //g' "$FILE"
  sed -i '' 's/ArrowLeft, //g' "$FILE"
  sed -i '' 's/Check, //g' "$FILE"
  sed -i '' "s/import Link from 'next\/link';//g" "$FILE"
  sed -i '' 's/, compressImage//g' "$FILE"
  sed -i '' 's/\[privateNotes, setPrivateNotes\]/[privateNotes, _setPrivateNotes]/g' "$FILE"
  sed -i '' 's/const \[endTime\]/const [_endTime]/g' "$FILE"
  echo "Fixed $FILE"
fi

echo "All fixes applied!"
