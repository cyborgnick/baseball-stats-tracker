bash

#!/bin/bash

echo "🚀 Starting Baseball Stats Tracker..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed!"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

# Backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "🔧 Starting backend..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

sleep 3

echo "🎨 Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Application started!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait