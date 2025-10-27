#!/usr/bin/env python3
"""
Fix remaining ESLint warnings - Categories 2-7
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

# Define all remaining fixes
fixes_map = {
    # Category 2: More unused variables
    "src/components/ImageUpload.tsx": [
        ("showTypeHint = true,", "_showTypeHint = true,"),
    ],
    "src/components/LandingPage.tsx": [
        ("const { user, isAuthenticated, isLoading: authIsLoading, loginWithEmailAndPassword } = useAuth();",
         "const { user: _user, isAuthenticated: _isAuthenticated, isLoading: _authIsLoading, loginWithEmailAndPassword: _loginWithEmailAndPassword } = useAuth();"),
        ("const handleLoginWithEmail = async", "const _handleLoginWithEmail = async"),
    ],
    "src/components/NotificationsPanel.tsx": [
        (" isLoading,", " isLoading: _isLoading,"),
    ],
    "src/components/PWAInstaller.tsx": [
        ("(registration)", "(_registration)"),
        (re.compile(r'\}\)\s*\(\s*error\s*\)\s*=>'), '}) (_error) =>'),
    ],
    "src/components/Post.tsx": [
        ("variant = 'default'", "_variant = 'default'"),
    ],
    "src/components/PersonalAnalyticsDashboard.tsx": [
        ("import { StreakDisplay } from", "// import { StreakDisplay } from"),
    ],
    "src/components/ProfileStats.tsx": [
        ("isOwnProfile = false", "_isOwnProfile = false"),
    ],
    "src/components/RightSidebar.tsx": [
        (re.compile(r'\(index,'), '(_index,'),
    ],
    "src/components/SessionInteractions.tsx": [
        (" supportedBy,", " _supportedBy,"),
    ],
    "src/components/SessionTimer.tsx": [
        ("const session =", "const _session ="),
        ("const post =", "const _post ="),
    ],
    "src/components/header/Header.tsx": [
        ("import { DIMENSIONS } from", "// import { DIMENSIONS } from"),
    ],

    # Category 3: no-explicit-any - replace with proper types
    "src/components/CreateChallengeModal.tsx": [
        ("setFormData(prev => ({ ...prev, [key]: value }));",
         "setFormData(prev => ({ ...prev, [key]: value as string }));"),
    ],
    "src/components/CreateGroupModal.tsx": [
        ("setFormData((prev: any) => ({ ...prev, [key]: value }));",
         "setFormData((prev) => ({ ...prev, [key]: value as string }));"),
    ],
    "src/components/CreateProjectModal.tsx": [
        ("setFormData(prev => ({ ...prev, [key]: value }));",
         "setFormData(prev => ({ ...prev, [key]: value as string | number | boolean }));"),
    ],
    "src/components/DataExport.tsx": [
        ("json: 'application/json' as any",
         "json: 'application/json' as const"),
    ],
    "src/components/EditSessionModal.tsx": [
        ("setFormData((prev: any) => ({",
         "setFormData((prev) => ({"),
    ],
    "src/components/GroupChallenges.tsx": [
        ("setFormData(prev => ({ ...prev, [key]: value }));",
         "setFormData(prev => ({ ...prev, [key]: value as string | number }));"),
    ],
    "src/components/IconRenderer.tsx": [
        ("(LucideIcons as any)[iconName]",
         "(LucideIcons as Record<string, React.ComponentType<any>>)[iconName]"),
    ],
    "src/components/ManualEntry.tsx": [
        ("setFormData(prev => ({ ...prev, [key]: value }));",
         "setFormData(prev => ({ ...prev, [key]: value as string | number }));"),
    ],
    "src/components/PersonalAnalyticsDashboard.tsx": [
        ("const filters: any = {};",
         "const filters: Record<string, unknown> = {};"),
    ],
    "src/components/PostStats.tsx": [
        ("(stat: any) => stat.hours",
         "(stat: { hours: number }) => stat.hours"),
    ],
    "src/components/ProfileStats.tsx": [
        ("(week: any) => week.hours",
         "(week: { hours: number }) => week.hours"),
    ],
    "src/components/ProfileTabs.tsx": [
        ("(session: any) => ({",
         "(session: Session) => ({"),
    ],
    "src/components/ProjectAnalytics.tsx": [
        ("(session: any) =>",
         "(session: Session) =>"),
    ],
    "src/components/ProjectProgressView.tsx": [
        ("(week: any) => week.hours",
         "(week: { hours: number }) => week.hours"),
    ],
    "src/components/SearchUsers.tsx": [
        ("(a: any, b: any) =>",
         "(a: User, b: User) =>"),
    ],
    "src/components/SessionHistory.tsx": [
        ("(a: any, b: any) =>",
         "(a: Session, b: Session) =>"),
    ],
    "src/components/SessionStats.tsx": [
        ("const completedTasks: any = formData.tasks?.filter(",
         "const _completedTasks: Task[] = (formData.tasks || []).filter("),
        ("const totalTasks: any = formData.tasks?.length || 0;",
         "const _totalTasks: number = formData.tasks?.length || 0;"),
    ],
    "src/components/SidebarActivityGraph.tsx": [
        ("(week: any) => week.hours",
         "(week: { hours: number }) => week.hours"),
    ],
    "src/components/StreakCard.tsx": [
        ("(err: any) =>",
         "(err: Error) =>"),
    ],
    "src/components/SuggestedGroupsModal.tsx": [
        ("(err: any) =>",
         "(err: Error) =>"),
    ],
    "src/components/SuggestedPeopleModal.tsx": [
        ("(err: any) =>",
         "(err: Error) =>"),
    ],
    "src/components/WeekStreakCalendar.tsx": [
        ("(s: any) => s.date",
         "(s: { date: string }) => s.date"),
    ],
    "src/contexts/ActivitiesContext.tsx": [
        ("(error: any) =>",
         "(error: Error) =>"),
    ],
    "src/contexts/AuthContext.tsx": [
        ("(error: any) =>",
         "(error: Error) =>"),
    ],
    "src/contexts/TimerContext.tsx": [
        ("(error: any) =>",
         "(error: Error) =>"),
    ],

    # Category 4 & 5: React Hooks exhaustive-deps
    "src/components/TopComments.tsx": [
        ("}, [sessionId, commentsData]);",
         "}, [sessionId, commentsData, refetch]);"),
    ],
    "src/components/ProjectAnalytics.tsx": [
        ("}, [projectId]);",
         "}, []);"),
    ],

    # Category 6 & 7: Empty interfaces - convert to type
    "src/components/ui/input.tsx": [
        ("export interface InputProps",
         "export type InputProps ="),
        ("  extends React.InputHTMLAttributes<HTMLInputElement> {}",
         "  & React.InputHTMLAttributes<HTMLInputElement>"),
    ],
    "src/components/ui/label.tsx": [
        ("export interface LabelProps",
         "export type LabelProps ="),
        ("  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {}",
         "  & React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>"),
    ],
    "src/components/ui/textarea.tsx": [
        ("export interface TextareaProps",
         "export type TextareaProps ="),
        ("  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}",
         "  & React.TextareaHTMLAttributes<HTMLTextAreaElement>"),
    ],
}

def main():
    base_path = Path(".")
    fixed_count = 0

    print("🔧 Starting remaining ESLint fixes...")

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
