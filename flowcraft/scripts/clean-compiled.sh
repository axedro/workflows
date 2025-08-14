#!/bin/bash

# Script to clean compiled TypeScript files from src directories
# This prevents issues with TypeScript using compiled files instead of source files

echo "🧹 Cleaning compiled TypeScript files from src directories..."

# Find and remove compiled files from packages
find packages -name "*.js" -o -name "*.d.ts" -o -name "*.js.map" -o -name "*.d.ts.map" | grep -v node_modules | grep -v dist | xargs rm -f 2>/dev/null || true

# Find and remove compiled files from apps
find apps -name "*.js" -o -name "*.d.ts" -o -name "*.js.map" -o -name "*.d.ts.map" | grep -v node_modules | grep -v dist | grep -v build | xargs rm -f 2>/dev/null || true

# Remove TypeScript build info files
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true

echo "✅ Cleanup completed!"
echo "📝 Remember to run this script if you encounter issues with TypeScript not picking up changes"
