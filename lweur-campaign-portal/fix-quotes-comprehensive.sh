#!/bin/bash

# Comprehensive script to fix all quote escape issues in TypeScript/JSX files

echo "Running comprehensive quote fix for Next.js 15.5.2 compatibility..."

# Find all TypeScript and TSX files and fix all quote escape patterns
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    echo "Processing: $file"
    
    # Fix all escaped quotes in JSX - be very thorough
    sed -i '' 's/\\"/"/g' "$file"
    
    # Fix specific attribute patterns that may have been missed
    sed -i '' 's/="[^"]*\\"/="/g' "$file"
    sed -i '' 's/\\"[^"]*"="/="/g' "$file"
    
    # Fix closing quotes at end of attributes
    sed -i '' 's/\\">/\">/g' "$file"
    sed -i '' 's/\\">/">/g' "$file"
    
    # Fix trailing quotes after closing braces and exports
    sed -i '' 's/}";$/};/g' "$file"
    sed -i '' 's/}\"$/}/g' "$file"
    sed -i '' 's/}\\"$/}/g' "$file"
    sed -i '' 's/};\"$/};/g' "$file"
    
done

echo "Comprehensive quote fix completed"