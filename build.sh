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

    echo "Starting TS Check"
    rm -rf dist/ts/*
    tsc --noEmit
    echo "Building TS"
    npx esbuild src/main.ts --bundle --outfile=dist/ts/main.js
    find dist/ts -type f -exec bash -c '
  for f; do
    dir=$(dirname "$f")
    base=$(basename "$f")
    mv "$f" "$dir/str.$base"
  done
' bash {} +

    echo "TS Built"
    
    echo "Packing ZAP"
    npx webpack
    rm -f dist/bundle.js
    latest_file=$(ls -t dist/ | head -n 1)
    cp "dist/$latest_file" dist/bundle.js
    echo "Done!"

    # Save the new hash
    echo "$NEW_HASH" > "$HASH_FILE"
else
    echo "No changes detected. Skipping build."
fi
