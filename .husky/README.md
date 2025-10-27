# Husky Pre-Commit Hooks

This directory contains Git hooks managed by Husky that enforce code quality standards before commits.

## Hooks Installed

### pre-commit
Runs lint-staged to automatically format and lint staged files before each commit.

- **Triggers**: Automatically runs before `git commit`
- **Scope**: Only checks files you've staged with `git add`
- **Auto-fixes**: Prettier formatting and ESLint auto-fixes are applied
- **Blocks commits**: If tasks fail, commit is prevented

## Configuration

The hook configuration is defined in `package.json` under the `lint-staged` key:

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

## File Processing

When you run `git commit`:

1. **TypeScript/TSX files** (*.{ts,tsx}):
   - Prettier formats code
   - ESLint auto-fixes issues
   - If fixes fail, commit is blocked

2. **JSON/Markdown files** (*.{json,md}):
   - Prettier formats code
   - Commit proceeds if successful

## Common Scenarios

### Committing Successfully

```bash
git add src/components/MyComponent.tsx
git commit -m "Add new component"
# Hook runs automatically:
# - Prettier formats the file
# - ESLint fixes any issues
# - Commit completes if successful
```

### Hook Blocks Commit

If lint-staged finds errors that can't be auto-fixed:

```
husky - pre-commit hook exited with code 1 (error)
# Review the error message, fix manually, then commit again
```

### Skip Hook (Not Recommended)

To skip the hook in exceptional cases:

```bash
git commit --no-verify
# Note: This bypasses quality checks and should rarely be used
```

## Troubleshooting

### Hook Not Running

Ensure pre-commit is executable:
```bash
chmod +x .husky/pre-commit
```

### Dependencies Missing

Reinstall dependencies:
```bash
npm install
```

### Merge Conflicts

If you see stash conflicts during lint-staged:
```bash
git reset --hard
npm install
git add <files>
git commit
```

## Manual Checking

Run the same checks manually without committing:

```bash
# Check specific files
npx lint-staged --debug

# Format code
npm run format

# Lint code
npm run lint:fix

# Check formatting without changes
npm run format:check

# Type check
npm run type-check
```

## Disabling Hook (Temporary)

For development debugging, you can temporarily disable the hook:

```bash
# List hooks
npm run prepare

# Manually invoke without hook
git -c core.hooksPath=/dev/null commit
```

## Requirements

- Node.js 20+
- npm 10+
- Git 2.9+

## Reinstalling Hooks

If hooks get corrupted or lost:

```bash
npm install
npx husky install
```

This will reinstall all git hooks defined in `.husky/`.
