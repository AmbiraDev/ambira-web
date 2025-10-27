#!/usr/bin/env python3
"""
Comprehensive ESLint fix script
Fixes all ESLint warnings systematically
"""

import re
from pathlib import Path

def fix_file(filepath, fixes):
    """Apply fixes to a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        for pattern, replacement in fixes:
            if isinstance(pattern, str):
                content = content.replace(pattern, replacement)
            else:  # regex
                content = pattern.sub(replacement, content)

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

# Define all fixes
fixes_map = {
    # Category 1: Unused Imports
    "src/components/RightSidebar.tsx": [
        ("import React, { useState, useEffect, useCallback } from 'react';",
         "import React, { useState, useEffect } from 'react';"),
    ],
    "src/components/SessionHistory.tsx": [
        ("import React, { useState, useEffect, useCallback } from 'react';",
         "import React, { useState, useEffect } from 'react';"),
    ],
    "src/components/ManualSessionRecorder.tsx": [
        (", SessionFormData", ""),
        (", Link", ""),
        (", compressImage", ""),
    ],
    "src/components/PrivacySettings.tsx": [
        ("import { useAuth } from '@/hooks/useAuth';", ""),
    ],
    "src/components/header/Header.tsx": [
        (", DIMENSIONS", ""),
    ],
    "src/features/comments/services/CommentService.ts": [
        (", Comment", ""),
        (", ValidatedCreateCommentData", ""),
        (", ValidatedUpdateCommentData", ""),
    ],
    "src/features/feed/services/FeedService.ts": [
        (", Session", ""),
    ],
    "src/features/feed/hooks/useFeed.ts": [
        (", FeedOptions", ""),
    ],

    # Category 2: Unused Variables
    "src/components/Feed.tsx": [
        (re.compile(r'catch\s*\(err\)\s*{'), 'catch (_err) {'),
    ],
    "src/components/GroupTabs.tsx": [
        ("const isAdmin = ", "const _isAdmin = "),
    ],
    "src/components/ImageUpload.tsx": [
        ("const showTypeHint = ", "const _showTypeHint = "),
    ],
    "src/components/LandingPage.tsx": [
        ("const { user, isAuthenticated, isLoading: authIsLoading, loginWithEmailAndPassword } = useAuth();",
         "const { user: _user, isAuthenticated: _isAuthenticated, isLoading: _authIsLoading, loginWithEmailAndPassword: _handleLoginWithEmail } = useAuth();"),
    ],
    "src/components/NotificationsPanel.tsx": [
        ("const [isLoading,", "const [_isLoading,"),
    ],
    "src/components/PWAInstaller.tsx": [
        ("const [registration,", "const [_registration,"),
        ("const [error,", "const [_error,"),
    ],
    "src/components/Post.tsx": [
        ("variant = 'default'", "_variant = 'default'"),
    ],
    "src/components/PostInteractions.tsx": [
        ("supportCount,", "_supportCount,"),
    ],
    "src/components/PrivacySettings.tsx": [
        ("const loadBlockedUsers", "// const loadBlockedUsers"),
        ("const getVisibilityIcon", "// const getVisibilityIcon"),
        ("const getVisibilityDescription", "// const getVisibilityDescription"),
    ],
    "src/components/ProfileStats.tsx": [
        ("isOwnProfile = false", "_isOwnProfile = false"),
        (re.compile(r'\(index\)\s*=>\s*'), '(_index) => '),
    ],
    "src/components/ProfileTabs.tsx": [
        ("showPrivateContent = false,", "_showPrivateContent = false,"),
        ("userId,", "_userId,"),
        ("const [isLoadingSessions,", "const [_isLoadingSessions,"),
    ],
    "src/components/ProjectAnalytics.tsx": [
        (re.compile(r'weekKey(?!\w)'), '_weekKey'),
    ],
    "src/components/RightSidebar.tsx": [
        (re.compile(r'\(index,'), '(_index,'),
        (re.compile(r'catch\s*\(error\)\s*{'), 'catch (_error) {'),
    ],
    "src/components/SaveSession.tsx": [
        ("const [showPostModal,", "// const [showPostModal,"),
        ("setShowPostModal,", "// setShowPostModal,"),
        ("const getAuthToken", "// const getAuthToken"),
        ("const handlePostSuccess", "// const handlePostSuccess"),
        ("const handlePostCancel", "// const handlePostCancel"),
    ],
    "src/components/SessionCard.tsx": [
        (re.compile(r'catch\s*\(error\)\s*{'), 'catch (_error) {'),
    ],
    "src/components/SessionInteractions.tsx": [
        ("supportedBy,", "_supportedBy,"),
        ("onViewAllCommentsClick,", "_onViewAllCommentsClick,"),
    ],
    "src/components/SessionStats.tsx": [
        ("const completedTasks", "// const completedTasks"),
        ("const totalTasks", "// const totalTasks"),
    ],
    "src/components/SessionTimer.tsx": [
        ("const token =", "const _token ="),
        ("const session =", "const _session ="),
        ("const post =", "const _post ="),
    ],
    "src/components/timer/FinishSessionModal.tsx": [
        ("onCancel,", "_onCancel,"),
    ],
    "src/features/comments/services/CommentService.ts": [
        ("cursor,", "_cursor,"),
    ],
    "src/features/feed/services/FeedService.ts": [
        ("cursor,", "_cursor,"),
    ],
    "src/features/groups/hooks/useGroupLeaderboard.ts": [
        (re.compile(r'catch\s*\(error\)\s*{'), 'catch (_error) {'),
    ],
    "src/features/groups/hooks/useGroupMembers.ts": [
        (re.compile(r'catch\s*\(error\)\s*{'), 'catch (_error) {'),
    ],
    "src/features/profile/hooks/useProfile.ts": [
        ("isLoading:", "_isLoading:"),
    ],
}

def main():
    base_path = Path(".")
    fixed_count = 0

    print("🔧 Starting comprehensive ESLint fixes...")

    for filepath, fixes in fixes_map.items():
        full_path = base_path / filepath
        if full_path.exists():
            if fix_file(full_path, fixes):
                fixed_count += 1
                print(f"✅ Fixed: {filepath}")
        else:
            print(f"⚠️  Not found: {filepath}")

    print(f"\n🎉 Fixed {fixed_count} files!")
    print("Run 'npm run lint' to verify fixes.")

if __name__ == "__main__":
    main()
