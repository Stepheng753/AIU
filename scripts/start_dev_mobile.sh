#!/bin/bash

# Navigate to workspace root relative to script location
cd "$(dirname "$0")/.."

echo "=========================================================="
echo "📱 AIU Mobile Development Server Launcher"
echo "=========================================================="
echo "⚠️  Ensure Tailscale is Active:"
echo "   1. Ensure Tailscale is running and authenticated on this computer."
echo "      Host Computer IP: 100.67.12.101 (Alias: stephen-windows)"
echo "   2. Ensure Tailscale is enabled on your mobile device."
echo "      (Both devices must be signed into the same Tailnet)"
echo ""
echo "🔌 Ensure Backend is Running:"
echo "   - Ensure aiu-backend is running on port 3001, listening on 0.0.0.0"
echo "     (Tip: You can use scripts/start_dev_web.sh to boot it!)"
echo ""
echo "🚀 Launching Metro Bundler..."
echo "   - Once the QR code is generated, scan it in Expo Go to start."
echo "=========================================================="
echo ""

# Start Metro Bundler
cd aiu-mobile
npm run start
