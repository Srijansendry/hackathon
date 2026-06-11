#!/bin/bash

smart_install() {
  local dir="$1"
  local lock_file="$dir/package-lock.json"
  local hash_cache="$dir/.install-hash"

  current_hash=$(md5sum "$lock_file" 2>/dev/null | awk '{print $1}')
  cached_hash=$(cat "$hash_cache" 2>/dev/null)

  if [ "$current_hash" = "$cached_hash" ] && [ -d "$dir/node_modules" ]; then
    echo "[$dir] Dependencies up to date, skipping npm install"
  else
    echo "[$dir] Installing dependencies..."
    (cd "$dir" && npm install)
    echo "$current_hash" > "$hash_cache"
  fi
}

smart_install client
npm run build --prefix client

smart_install server
NODE_ENV=production PORT=5000 node server/server.js
