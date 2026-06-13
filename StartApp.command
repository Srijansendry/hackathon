#!/bin/bash

# Change directory to the folder containing this script
cd "$(dirname "$0")"

clear
echo "========================================================="
echo "   🚀  GLUCOLYSE APPLICATION LAUNCHER (macOS)   "
echo "========================================================="
echo ""

# Detect package manager (Prefer bun if installed, otherwise npm)
if command -v bun &> /dev/null; then
  PKG_MANAGER="bun"
  INSTALL_CMD="bun install"
  DEV_CMD="bun run dev"
  START_CMD="bun run start"
else
  PKG_MANAGER="npm"
  INSTALL_CMD="npm install"
  DEV_CMD="npm run dev"
  START_CMD="npm run start"
fi

echo "📦 Using package manager: $PKG_MANAGER"
echo ""

# 1. Install Client Dependencies & Build
echo "🔧 Setting up client application..."
cd client
$INSTALL_CMD
echo "⚡ Compiling frontend assets..."
if [ "$PKG_MANAGER" = "bun" ]; then
  bun run build
else
  npm run build
fi
cd ..
echo "✓ Client setup complete!"
echo ""

# 2. Install Server Dependencies
echo "🔧 Setting up backend server..."
cd server
$INSTALL_CMD
cd ..
echo "✓ Server setup complete!"
echo ""

# 3. Start Application
echo "🚀 Starting both servers..."
echo "---------------------------------------------------------"

# Start backend server in the background
cd server
if [ "$PKG_MANAGER" = "bun" ]; then
  bun run server.js &
else
  node server.js &
fi
SERVER_PID=$!
cd ..

# Start frontend dev server in the background
cd client
$DEV_CMD &
CLIENT_PID=$!
cd ..

# Handle clean shutdown on Ctrl+C or closing terminal
cleanup() {
  echo ""
  echo "🛑 Shutting down Glucolyse application..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "🎉 Glucolyse is now running!"
echo "   👉 Backend Server: http://localhost:3001 (or port 5000)"
echo "   👉 Frontend App:   http://localhost:5173 (or port 5001)"
echo "---------------------------------------------------------"
echo "Press Ctrl+C to stop the servers."
echo ""

# Wait 2 seconds and open the app in the default browser
sleep 2.5
if [ "$PKG_MANAGER" = "bun" ]; then
  open http://localhost:5001 2>/dev/null || open http://localhost:5173 2>/dev/null
else
  open http://localhost:5173 2>/dev/null || open http://localhost:5001 2>/dev/null
fi

# Keep the script running
wait $CLIENT_PID $SERVER_PID
