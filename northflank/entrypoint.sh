#!/bin/bash
set -e

echo "🚀 Starting SecQ-Auto Services on Northflank..."

# Start Qdrant in background
echo "📦 Starting Qdrant on port 6333..."
qdrant --config-path /app/qdrant-config.yaml &
QDRANT_PID=$!

# Wait for Qdrant to be ready
echo "⏳ Waiting for Qdrant to start..."
for i in {1..30}; do
    if curl -sf http://localhost:6333/health > /dev/null 2>&1; then
        echo "✅ Qdrant is ready!"
        break
    fi
    sleep 1
done

# Start OmniRoute in background
echo "🤖 Starting OmniRoute on port 3000..."
cd /app/omniroute
npm start &
OMNI_PID=$!

# Wait for OmniRoute to be ready
echo "⏳ Waiting for OmniRoute to start..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ OmniRoute is ready!"
        break
    fi
    sleep 1
done

# Start 9Router in background
echo "🔀 Starting 9Router on port 4000..."
cd /app/router9
npm start &
ROUTER9_PID=$!

# Wait for 9Router to be ready
echo "⏳ Waiting for 9Router to start..."
for i in {1..30}; do
    if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
        echo "✅ 9Router is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "🎉 ============================================"
echo "   SecQ-Auto is running 24/7 on Northflank!"
echo "   OmniRoute:  http://localhost:3000"
echo "   9Router:    http://localhost:4000"
echo "   Qdrant:     http://localhost:6333"
echo "============================================"
echo ""

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $ROUTER9_PID 2>/dev/null || true
    kill $OMNI_PID 2>/dev/null || true
    kill $QDRANT_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for any process to exit
wait -n

# If we get here, something went wrong
echo "⚠️ A service exited unexpectedly"
cleanup