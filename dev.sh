#!/bin/bash
# Start MariaDB, backend, and frontend dev servers

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Use Node 20 via nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1

# Start MariaDB if not already running
if ! mysql -u root -proot -e "SELECT 1" >/dev/null 2>&1; then
  echo "Starting MariaDB..."
  /opt/homebrew/bin/mariadbd --user="$(whoami)" --datadir=/opt/homebrew/var/mysql &
  MARIADB_PID=$!
  sleep 2
  echo "MariaDB started (PID: $MARIADB_PID)"
else
  echo "MariaDB already running"
  MARIADB_PID=""
fi

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  if [ -n "$MARIADB_PID" ]; then
    kill $MARIADB_PID 2>/dev/null
    wait $MARIADB_PID 2>/dev/null
    echo "MariaDB stopped"
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM

# Backend
cd "$ROOT/backend"
npm run dev &
BACKEND_PID=$!

# Frontend
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:3011 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "Press Ctrl+C to stop all."
echo ""

wait
