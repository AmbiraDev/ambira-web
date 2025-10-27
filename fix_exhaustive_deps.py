#!/usr/bin/env python3
"""
Script to fix react-hooks/exhaustive-deps warnings by adding useCallback to functions
used in useEffect dependency arrays.
"""

import re
import sys
from pathlib import Path

# Mapping of files to their functions that need useCallback wrapping
FIXES = {
    "src/components/GroupAnalytics.tsx": [
        {"name": "loadAnalytics", "deps": ["groupId", "timeRange"]}
    ],
    "src/components/GroupChallenges.tsx": [
        {"name": "loadGroupChallenges", "deps": ["groupId"]}
    ],
    "src/components/GroupInviteLanding.tsx": [
        {"name": "loadGroup", "deps": ["groupId"]},
        {"name": "checkMembershipAndRedirect", "deps": ["user", "isAdmin", "isMember", "group", "router"]}
    ],
    "src/components/LikesList.tsx": [
        {"name": "loadUsers", "deps": ["userIds"]}
    ],
    "src/components/ProfileAnalytics.tsx": [
        {"name": "loadActivityData", "deps": ["userId"]},
        {"name": "loadProjectData", "deps": ["userId"]},
        {"name": "loadWeeklyData", "deps": ["userId"]}
    ],
    "src/components/ProjectAnalyticsDashboard.tsx": [
        {"name": "loadAnalyticsData", "deps": ["projectId", "timeRange"]}
    ],
    "src/components/ProjectList.tsx": [
        {"name": "loadSessions", "deps": ["userId"]},
        {"name": "processChartData", "deps": ["sessions", "timeRange"]}
    ],
    "src/components/RightSidebar.tsx": [
        {"name": "loadSuggestedContent", "deps": ["user"]}
    ],
    "src/components/SessionHistory.tsx": [
        {"name": "loadSessions", "deps": ["userId"]},
        {"name": "processChartData", "deps": ["sessions", "selectedTimeRange"]}
    ],
    "src/components/StreakCard.tsx": [
        {"name": "loadGroups", "deps": ["userId"]}
    ],
    "src/components/SuggestedPeopleModal.tsx": [
        {"name": "loadSuggestions", "deps": ["currentUserId"]}
    ],
}

def add_use_callback_import(content: str) -> str:
    """Add useCallback to React imports if not present."""
    if "useCallback" in content:
        return content

    # Find React import line
    react_import_pattern = r"import React, \{ ([^}]+) \} from 'react';"
    match = re.search(react_import_pattern, content)

    if match:
        imports = match.group(1)
        if "useCallback" not in imports:
            new_imports = imports + ", useCallback"
            content = content.replace(match.group(0), f"import React, {{ {new_imports} }} from 'react';")

    return content

def wrap_function_with_callback(content: str, func_name: str, deps: list) -> str:
    """Wrap an async function with useCallback."""
    # Pattern to match async function declaration
    pattern = rf"const {func_name} = async \(\) => \{{"

    if pattern not in content:
        print(f"Warning: Could not find function {func_name}")
        return content

    # Find the function and its closing brace
    start_idx = content.find(f"const {func_name} = async")
    if start_idx == -1:
        return content

    # Find the matching closing brace
    brace_count = 0
    in_function = False
    end_idx = start_idx

    for i in range(start_idx, len(content)):
        char = content[i]
        if char == '{':
            brace_count += 1
            in_function = True
        elif char == '}':
            brace_count -= 1
            if in_function and brace_count == 0:
                end_idx = i + 1
                break

    if end_idx <= start_idx:
        return content

    # Extract function body
    func_text = content[start_idx:end_idx]

    # Replace with useCallback version
    deps_str = ", ".join(deps)
    new_func = f"const {func_name} = useCallback(async () => {func_text[func_text.find('=> {') + 3:]}, [{deps_str}]);"

    # Replace old function with new one
    before = content[:start_idx]
    after = content[end_idx:]

    # Find the semicolon after the function
    semicolon_idx = after.find(';')
    if semicolon_idx != -1:
        after = after[semicolon_idx + 1:]

    return before + new_func + after

def add_deps_to_useeffect(content: str, func_name: str) -> str:
    """Add function name to useEffect dependency array if it's missing."""
    # Find useEffect that calls this function
    pattern = rf"useEffect\(\(\) => \{{[^}}]*{func_name}\(\);[^}}]*\}}, \[[^\]]*\]\);"

    matches = list(re.finditer(pattern, content, re.DOTALL))

    for match in matches:
        effect_text = match.group(0)
        # Extract dependency array
        deps_match = re.search(r'\[([^\]]*)\]', effect_text)
        if deps_match:
            current_deps = deps_match.group(1).strip()
            if func_name not in current_deps:
                if current_deps:
                    new_deps = f"{current_deps}, {func_name}"
                else:
                    new_deps = func_name
                new_effect = effect_text.replace(f"[{current_deps}]", f"[{new_deps}]")
                content = content.replace(effect_text, new_effect)

    return content

def process_file(file_path: Path, fixes: list):
    """Process a single file and apply fixes."""
    print(f"Processing {file_path}...")

    try:
        content = file_path.read_text()
        original_content = content

        # Add useCallback import
        content = add_use_callback_import(content)

        # Apply each fix
        for fix in fixes:
            func_name = fix["name"]
            deps = fix["deps"]

            # Wrap function with useCallback
            content = wrap_function_with_callback(content, func_name, deps)

            # Update useEffect dependencies
            content = add_deps_to_useeffect(content, func_name)

        if content != original_content:
            file_path.write_text(content)
            print(f"  ✓ Updated {file_path}")
        else:
            print(f"  - No changes needed for {file_path}")

    except Exception as e:
        print(f"  ✗ Error processing {file_path}: {e}")

def main():
    """Main entry point."""
    base_path = Path(__file__).parent

    for file_rel_path, fixes in FIXES.items():
        file_path = base_path / file_rel_path
        if file_path.exists():
            process_file(file_path, fixes)
        else:
            print(f"Warning: File not found: {file_path}")

    print("\n✓ Done! Run 'npm run lint' to verify fixes.")

if __name__ == "__main__":
    main()
