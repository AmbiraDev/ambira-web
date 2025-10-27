#!/bin/bash

# Extract auth module (lines 496-1053)
sed -n '496,1053p' src/lib/firebaseApi.ts > /tmp/auth_raw.txt

# Extract the helper functions needed by auth
sed -n '1,62p' src/lib/firebaseApi.ts > /tmp/imports_and_helpers.txt

echo "Extracted auth module sections"
