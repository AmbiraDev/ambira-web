#!/bin/bash

# Push environment variables from .env.local to Vercel
# This script reads .env.local and pushes each NEXT_PUBLIC_ variable to Vercel production

set -e

echo "🚀 Pushing environment variables to Vercel..."
echo ""

if [ ! -f ".env.local" ]; then
  echo "❌ Error: .env.local file not found"
  exit 1
fi

# Read .env.local and push each NEXT_PUBLIC_ variable
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" || "$key" == \#* ]]; then
    continue
  fi

  # Only process NEXT_PUBLIC_ variables
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    echo "📤 Pushing: $key"
    echo "$value" | vercel env add "$key" production --force
  fi
done < .env.local

echo ""
echo "✅ All environment variables pushed to Vercel production!"
echo ""
echo "Next steps:"
echo "1. Run 'vercel --prod' to deploy to production"
echo "2. Or push to GitHub 'main' branch for automatic deployment"
