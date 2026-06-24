#!/bin/bash
set -e

# Source profile to ensure NVM node and PM2 are in the PATH
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🚀 Deploying AIU Project..."

# Navigate to workspace root
cd "$(dirname "$0")/.."

# Pull latest changes
git pull origin main

# 1. Update Backend
echo "--- Processing Backend ---"
cd aiu-backend
npm install
pm2 restart aiu-backend || PORT=3000 GEMINI_API_KEY="$GEMINI_API_KEY" pm2 start src/index.js --name "aiu-backend"
pm2 save

# 2. Compile Frontend
echo "--- Processing Frontend ---"
cd ../aiu-web
npm install
echo "VITE_API_URL=https://AIU.stepheng753.com/api" > .env.production
echo "VITE_WS_URL=wss://AIU.stepheng753.com/ws" >> .env.production
npm run build

# 3. Reload Nginx
echo "--- Reloading Nginx ---"
sudo nginx -t
sudo systemctl reload nginx

echo "✅ All Systems Deployed!"
