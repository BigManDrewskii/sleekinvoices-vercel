#!/bin/bash

# Generate AUTH_SECRET and add to .env.local
# Run: bash scripts/generate-auth-secret.sh

echo "Generating AUTH_SECRET..."
openssl rand -base64 32 > /tmp/auth_secret.txt
AUTH_SECRET=$(cat /tmp/auth_secret.txt)

echo "Adding AUTH_SECRET to .env.local..."
sed -i '' '/^AUTH_SECRET=/s# AUTH_SECRET=/' .env.local

echo "✅ AUTH_SECRET generated and added to .env.local"
echo ""
echo "Your AUTH_SECRET is: $AUTH_SECRET"
echo ""
echo "IMPORTANT: Copy this value to .env.local if you want to use it"
