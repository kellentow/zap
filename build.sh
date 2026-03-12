#!/bin/bash
set -e
force=false
[[ " $* " == *" -f "* ]] && force=true

# Path to the hash file
HASH_FILE=".last_build_hash"

# Get hash of source files (modify as needed for your project structure)
NEW_HASH=$(find src -type f -print0 | sort -z | xargs -0 md5sum | md5sum | cut -d ' ' -f1)

# Read the last hash if it exists
OLD_HASH=""
if [ -f "$HASH_FILE" ]; then
    OLD_HASH=$(cat "$HASH_FILE")
fi

# Compare hashes
if [[ "$NEW_HASH" != "$OLD_HASH" ]] || $force; then
    echo "Source changed, rebuilding..."

    echo "Packing Assets"
    python3 pack.py ./assets ./src/assets.json
    echo "Assets Packed"

    #echo "Starting TS Check"
    rm -rf dist/ts/*
    #tsc --noEmit
    echo "Building TS"
    npx esbuild src/main.ts --bundle --outfile=dist/ts/main.js --minify --sourcemap
    npx esbuild src/main.ts --bundle --outfile=dist/ts/main.big.js --sourcemap > /dev/null 2>&1
    for f in dist/ts/*; do
      mv "$f" "dist/ts/str.$(basename "$f")"
    done

    echo "TS Built"
    
    echo "Packing ZAP"
    npx webpack
    rm -f dist/bundle.js
    latest_file=$(ls -t dist/ | head -n1)
    mv "dist/$latest_file" "dist/bundles/"
    ln -s "bundles/$latest_file" "dist/bundle.js"

    #echo "Building electron (experimental)"

    #npx electron-forge make

    
    # Save the new hash
    echo "$NEW_HASH" > "$HASH_FILE"
else
    echo "No changes detected. Skipping build."
fi
