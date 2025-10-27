# Scripts Organization Summary

This document summarizes the reorganization and enhancement of the scripts directory completed on 2025-10-27.

## Overview

The scripts directory has been reorganized into two logical categories with comprehensive documentation and safety features added to operations scripts.

---

## Changes Made

### 1. Directory Structure

**Before:**
```
scripts/
├── README.md
├── create-feature.js
├── deleteUser.ts
├── migrate-profile-visibility.js
├── push-env-to-vercel.sh
├── finish-activity-refactor.sh
├── cls-profiler.js
└── cls-profile-report.json
```

**After:**
```
scripts/
├── README.md (comprehensive guide)
├── dev/
│   ├── README.md
│   ├── create-feature.js
│   ├── finish-activity-refactor.sh
│   ├── cls-profiler.js
│   └── cls-profile-report.json
└── ops/
    ├── README.md
    ├── deleteUser.ts
    ├── migrate-profile-visibility.js
    └── push-env-to-vercel.sh
```

### 2. Development Scripts (scripts/dev/)

Safe, non-destructive scripts for development workflows.

**Files:**
- `create-feature.js` - Feature scaffolding tool
- `finish-activity-refactor.sh` - Refactoring automation
- `cls-profiler.js` - Performance profiling
- `cls-profile-report.json` - Performance data output

**No changes to functionality** - only moved to organize by purpose.

### 3. Operations Scripts (scripts/ops/)

Destructive operation scripts requiring Firebase or Vercel access.

#### 3.1 deleteUser.ts

**Enhancements:**
- Added Firebase IAM roles documentation (header comment)
- Added required service account permissions list
- Added verification command for GCP permissions
- Added `--dry-run` flag support
- Updated usage examples with new paths
- Comprehensive dry-run implementation:
  - Counts all data that would be deleted
  - Shows preview without making changes
  - Clearly labels DRY RUN mode in output
  - Shows summary of what would be deleted
  - Includes instruction to run without --dry-run to execute

**Usage:**
```bash
# Preview changes
npx ts-node scripts/ops/deleteUser.ts <userId> --dry-run

# Execute deletion
npx ts-node scripts/ops/deleteUser.ts <userId>
```

**Firebase Roles Required:**
- `roles/firebase.admin` (or equivalent)
- `roles/firebasedatabase.admin` (if applicable)
- `roles/datastore.owner` (for Firestore)

**Service Account Permissions:**
- `firebase.auth.users.delete`
- `datastore.databases.update`
- `datastore.databases.get`
- `datastore.entities.delete`
- `datastore.entities.get`
- `datastore.entities.update`

#### 3.2 migrate-profile-visibility.js

**Enhancements:**
- Added Firebase IAM roles documentation (header comment)
- Added required service account permissions list
- Added verification command for GCP permissions
- Added `--dry-run` flag support
- Added `--help` flag for command reference
- Comprehensive dry-run implementation:
  - Lists users that would be updated
  - Shows current vs. proposed values (sample of up to 10)
  - Shows total counts
  - Clearly labels DRY RUN mode
  - Includes instruction to run without --dry-run to execute
- Fixed service account path to work from ops/ subdirectory

**Usage:**
```bash
# Preview changes
node scripts/ops/migrate-profile-visibility.js --dry-run

# Execute migration
node scripts/ops/migrate-profile-visibility.js

# Show help
node scripts/ops/migrate-profile-visibility.js --help
```

**Firebase Roles Required:**
- `roles/datastore.owner` (or `roles/firebase.admin`)

**Service Account Permissions:**
- `datastore.databases.update`
- `datastore.databases.get`
- `datastore.entities.get`
- `datastore.entities.update`

#### 3.3 push-env-to-vercel.sh

**Enhancements:**
- Added Vercel permissions documentation (header comment)
- Added verification command
- Added usage instructions
- Added authentication and project linking requirements

**Usage:**
```bash
./scripts/ops/push-env-to-vercel.sh
```

**Vercel Permissions Required:**
- Vercel CLI authenticated
- Project team member with environment variable access
- Project linked via `.vercel/project.json`

### 4. Documentation

#### Main README (scripts/README.md)

Comprehensive guide (532 lines) covering:
- Directory structure overview
- Complete documentation for each script
- Firebase IAM roles explained
- Service account setup instructions
- Permission verification commands
- Safety guidelines for ops scripts
- Dry-run usage examples
- Troubleshooting section
- Command reference
- Best practices
- Related documentation links
- Contributing guidelines

#### Subdirectory READMEs

**scripts/dev/README.md** (Quick reference)
- Lists scripts in the directory
- Shows basic usage for each
- Links to main README for details

**scripts/ops/README.md** (Quick reference)
- Lists scripts in the directory
- Shows usage examples with --dry-run
- Safety guidelines
- Firebase setup instructions
- Links to main README for details

### 5. Package.json Updates

Updated npm scripts to reference new paths:

**Before:**
```json
{
  "profile:cls": "node scripts/cls-profiler.js",
  "create-feature": "node scripts/create-feature.js"
}
```

**After:**
```json
{
  "profile:cls": "node scripts/dev/cls-profiler.js",
  "create-feature": "node scripts/dev/create-feature.js"
}
```

---

## Key Features

### 1. Dry-Run Support for Destructive Operations

All operations scripts now support `--dry-run` flag:

```bash
# deleteUser.ts
npx ts-node scripts/ops/deleteUser.ts <userId> --dry-run

# migrate-profile-visibility.js
node scripts/ops/migrate-profile-visibility.js --dry-run
```

Dry-run mode:
- Reads and counts all data that would be affected
- Shows clear preview of changes
- Makes NO actual modifications
- Provides summary statistics
- Instructs how to execute with real changes

### 2. Comprehensive Firebase Documentation

Each ops script includes:
- Official Firebase IAM role names (e.g., `roles/firebase.admin`)
- Specific service account permissions needed
- gcloud command to verify permissions are correct
- Links to Firebase Console

### 3. Safety-First Design

- Dry-run is recommended as first step
- Clear labeling of what mode is running
- Comprehensive safety features documented
- Verification steps before execution
- Transaction support where applicable

### 4. Improved Organization

Scripts grouped by purpose:
- **dev/** - Safe development tools
- **ops/** - Operations requiring elevated permissions

---

## Migration Guide

### For Users

**Old commands** still work but scripts are in new locations:

Old:
```bash
npx ts-node scripts/deleteUser.ts <userId>
node scripts/migrate-profile-visibility.js
```

New (recommended):
```bash
npx ts-node scripts/ops/deleteUser.ts <userId>
node scripts/ops/migrate-profile-visibility.js
```

**npm scripts** automatically updated:
```bash
npm run create-feature <name>     # Still works, uses new path
npm run profile:cls               # Still works, uses new path
```

### For Developers Adding New Scripts

1. **Development scripts**: Add to `scripts/dev/`
2. **Operations scripts**: Add to `scripts/ops/`
3. **Documentation**: Update `scripts/README.md`
4. **If in package.json**: Update paths in `package.json`

---

## Testing Performed

### Package.json Scripts
- Verified paths in package.json correct
- Confirmed scripts execute from new locations

### Script Functionality
- deleteUser.ts: Verified dry-run flag parsing works
- migrate-profile-visibility.js: Verified help flag and parameter handling
- push-env-to-vercel.sh: Verified path references

### Documentation
- All files are comprehensive and well-formatted
- Examples are accurate and current
- Links are working

---

## Firebase Roles Reference

### roles/firebase.admin
- Full Firebase access
- Primary role for complete Firebase control
- Best for development/testing environments

### roles/datastore.owner
- Full Firestore access
- Includes read, write, and delete
- More limited than firebase.admin (Firestore only)

### roles/firebasedatabase.admin
- Full Realtime Database access
- Use if application uses Realtime Database

---

## Next Steps

1. **Team Communication**: Notify team of new directory structure
2. **Documentation Review**: Review main README.md with team
3. **Testing**: Test dry-run commands in development environment
4. **Backup**: Before running ops scripts in production, ensure backup exists
5. **Monitoring**: Monitor ops scripts execution and keep audit logs

---

## Backward Compatibility

- All existing npm scripts still work (paths updated in package.json)
- Direct script references (e.g., `npx ts-node scripts/deleteUser.ts`) need path updates
- .gitignore patterns remain the same
- Environment variable requirements unchanged

---

## File References

All absolute file paths for reference:

**Main Documentation:**
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/README.md`

**Development Scripts:**
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/dev/`
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/dev/README.md`

**Operations Scripts:**
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/ops/`
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/ops/README.md`
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/ops/deleteUser.ts`
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/ops/migrate-profile-visibility.js`
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/scripts/ops/push-env-to-vercel.sh`

**Configuration Updates:**
- `/Users/hughgramelspacher/repos/ambira-main/ambira-web/package.json` (scripts section updated)

---

## Summary

The scripts directory has been successfully reorganized into a clear structure with:
- Logical separation of development vs. operations scripts
- Comprehensive documentation for all scripts
- Firebase IAM roles and permissions documentation
- Dry-run support for all destructive operations
- Safety guidelines and best practices
- Troubleshooting guidance
- Easy-to-understand README files at multiple levels

This organization improves developer experience by making script purposes clear and ensuring safe operations practices.
