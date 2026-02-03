#!/bin/bash
# SQF Tower - Start Script

echo "🏢 Starting SQF Tower..."
echo ""

# Kill any existing servers on our ports
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start bridge server
echo "Starting Tower Bridge..."
cd "$SCRIPT_DIR/bridge"
node server.js &
BRIDGE_PID=$!

sleep 1

# Start frontend server
echo "Starting Frontend..."
cd "$SCRIPT_DIR/app"
python3 -m http.server 8080 &
FRONTEND_PID=$!

sleep 1

# Get local IP for phone access
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🏢 SQF Tower is running!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Frontend:  http://localhost:8080"
echo "Bridge:    http://localhost:8081 (HTTP) / ws://localhost:8082 (WS)"
echo ""
if [ -n "$LOCAL_IP" ]; then
echo "📱 Phone:   http://${LOCAL_IP}:8080"
fi
echo ""
echo "Test event:"
echo "  curl -X POST http://localhost:8081/event \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"type\":\"thinking\",\"agent\":\"itombot\",\"data\":{\"thought\":\"Hello Tower!\"}}'"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Wait for interrupt
trap "echo ''; echo 'Stopping...'; kill $BRIDGE_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
