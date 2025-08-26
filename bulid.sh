#!/bin/bash
set -e
flag_f=false

# Parse options
while getopts ":f" opt; do
  case $opt in
    f)
      flag_f=true
      ;;
    \?) 
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done

# Path to the hash file
HASH_FILE=".last_build_hash"

# Get hash of source files (modify as needed for your project structure)
NEW_HASH=$(find src -type f -exec md5sum {} \; | sort | md5sum | cut -d ' ' -f1)

# Read the last hash if it exists
OLD_HASH=""
if [ -f "$HASH_FILE" ]; then
    OLD_HASH=$(cat "$HASH_FILE")
fi

# Compare hashes
if [[ "$NEW_HASH" != "$OLD_HASH" ]] || $flag_f; then
    echo "Source changed, rebuilding..."

    rm -r dist/ts/*
    tsc src/*.ts --outDir dist/ts
    find dist/ts -type f -name '*.js' -exec bash -c 'mv "$0" "${0%.js}.str.js"' {} \;
    
    npx webpack
    rm -f dist/bundle.js
    latest_file=$(ls -t dist/ | head -n 1)
    cp "dist/$latest_file" dist/bundle.js

    # Save the new hash
    echo "$NEW_HASH" > "$HASH_FILE"
else
    echo "No changes detected. Skipping build."
fi
