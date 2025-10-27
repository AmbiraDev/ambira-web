#!/bin/bash

# Script to systematically fix TypeScript errors across the codebase
# This script identifies and fixes common patterns found in the type-check output

echo "Starting TypeScript error fixes..."

# Pattern 1: Fix unused error variables (replace _err with err for console.error usage)
echo "Fixing error variable references..."
find src -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Check if file has catch block with _err but references err in console.error
  if grep -q "catch (_err)" "$file" && grep -q "console.error.*err[^o]" "$file"; then
    echo "  Fixing $file"
    sed -i '' 's/catch (_err)/catch (err)/g' "$file"
  fi

  # Check for catch blocks with no error variable but console.error references
  if grep -q "} catch {" "$file" && grep -q "console.error" "$file"; then
    echo "  Adding error parameter to $file"
    sed -i '' 's/} catch {/} catch (err) {/g' "$file"
  fi
done

echo "TypeScript error fixes completed!"
echo "Run 'npm run type-check' to verify fixes."
