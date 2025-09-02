#!/bin/bash

# Script to fix escaped quotes in TypeScript/JSX files for Next.js 15.5.2 compatibility

echo "Fixing escaped quotes in TypeScript/JSX files..."

# Find all TypeScript and TSX files and fix escaped quotes in JSX attributes
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    echo "Processing: $file"
    
    # Fix escaped quotes in JSX attributes (className="..." -> className="...")
    sed -i '' 's/className=\\"/className="/g' "$file"
    sed -i '' 's/href=\\"/href="/g' "$file"
    sed -i '' 's/src=\\"/src="/g' "$file"
    sed -i '' 's/alt=\\"/alt="/g' "$file"
    sed -i '' 's/id=\\"/id="/g' "$file"
    sed -i '' 's/type=\\"/type="/g' "$file"
    sed -i '' 's/placeholder=\\"/placeholder="/g' "$file"
    sed -i '' 's/value=\\"/value="/g' "$file"
    sed -i '' 's/name=\\"/name="/g' "$file"
    sed -i '' 's/xmlns=\\"/xmlns="/g' "$file"
    sed -i '' 's/viewBox=\\"/viewBox="/g' "$file"
    sed -i '' 's/fill=\\"/fill="/g' "$file"
    sed -i '' 's/stroke=\\"/stroke="/g' "$file"
    sed -i '' 's/strokeWidth=\\"/strokeWidth="/g' "$file"
    sed -i '' 's/cx=\\"/cx="/g' "$file"
    sed -i '' 's/cy=\\"/cy="/g' "$file"
    sed -i '' 's/r=\\"/r="/g' "$file"
    sed -i '' 's/d=\\"/d="/g' "$file"
    
    # Fix trailing quotes after closing braces
    sed -i '' 's/}";$/};/g' "$file"
    sed -i '' 's/}\"$/}/g' "$file"
    
    # Fix export statements with trailing quotes
    sed -i '' 's/};"/};/g' "$file"
done

echo "Fixed escaped quotes in all TypeScript/JSX files"