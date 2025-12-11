#!/bin/bash

# Baseball Stats Tracker - GitHub Quick Setup
# Run this script to automatically setup and push to GitHub

echo "⚾ Baseball Stats Tracker - GitHub Setup"
echo "========================================"
echo ""

# Configuration
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name [baseball-stats-tracker]: " REPO_NAME
REPO_NAME=${REPO_NAME:-baseball-stats-tracker}

echo ""
echo "Setting up repository: $GITHUB_USERNAME/$REPO_NAME"
echo ""

# Create project structure
echo "📁 Creating project structure..."
mkdir -p $REPO_NAME
cd $REPO_NAME

mkdir -p backend frontend/src frontend/public standalone docs

# Initialize git
echo "🔧 Initializing Git repository..."
git init
git branch -M main

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local

# Database
*.db
*.sqlite
*.sqlite3

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Build
dist/
build/
uploads/

# Temp
*.tmp
.cache/
EOF

# Create main README
cat > README.md << 'EOF'
# ⚾ Baseball Stats Tracker

A comprehensive baseball statistics tracking application.

## Quick Start

### Try it Now (No Installation)
Open `standalone/baseball-stats-standalone.html` in your browser!

### Full Installation
```bash
# Backend
cd backend
npm install
npm start

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

## Features
- User authentication
- Team & player management
- Comprehensive statistics tracking
- Advanced analytics (AVG, OBP, SLG, OPS, ERA, WHIP)
- Public API for sharing stats

## Documentation
- [Backend API](backend/README.md)
- [Frontend Guide](frontend/README.md)
- [Deployment](docs/DEPLOYMENT.md)

## Tech Stack
- **Backend:** Node.js, Express, SQLite, JWT
- **Frontend:** React, Vite, Tailwind CSS

## License
MIT License
EOF

# Create LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Create CONTRIBUTING.md
cat > CONTRIBUTING.md << 'EOF'
# Contributing

Thank you for your interest in contributing!

## How to Contribute
1. Fork the repository
2. Create feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open Pull Request

## Development Setup
```bash
cd backend && npm install
cd frontend && npm install
```

## Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Write clear commit messages

Thank you! 🎉
EOF

# Backend files
echo "📦 Creating backend files..."

cat > backend/.gitignore << 'EOF'
node_modules/
.env
*.db
uploads/
*.log
EOF

cat > backend/package.json << 'EOF'
{
  "name": "baseball-stats-api",
  "version": "1.0.0",
  "description": "Baseball Stats Tracker Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

cat > backend/.env.example << 'EOF'
PORT=3001
JWT_SECRET=change-this-to-a-secure-random-string-min-32-chars
NODE_ENV=development
EOF

cat > backend/README.md << 'EOF'
# Baseball Stats API

Backend API for Baseball Stats Tracker.

## Setup
```bash
npm install
cp .env.example .env
# Edit .env with your settings
npm start
```

Server runs on http://localhost:3001

## API Endpoints

### Authentication
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me

### Teams
- POST /api/v1/teams
- GET /api/v1/teams
- GET /api/v1/teams/:id
- PUT /api/v1/teams/:id
- DELETE /api/v1/teams/:id

### Players
- POST /api/v1/players
- GET /api/v1/teams/:teamId/players
- GET /api/v1/players/:id
- DELETE /api/v1/players/:id

### Games
- POST /api/v1/games
- GET /api/v1/players/:playerId/games
- PUT /api/v1/games/:id
- DELETE /api/v1/games/:id

### Public
- GET /api/v1/public/teams/:id
- GET /api/v1/public/players/:id

All protected endpoints require: `Authorization: Bearer <token>`
EOF

echo "/* Copy server.js code from artifact here */" > backend/server.js

# Frontend files
echo "🎨 Creating frontend files..."

cat > frontend/.gitignore << 'EOF'
node_modules
dist
.env
.env.local
*.log
.DS_Store
EOF

cat > frontend/package.json << 'EOF'
{
  "name": "baseball-stats-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}
EOF

cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
EOF

cat > frontend/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Baseball Stats Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
EOF

echo "/* Copy App.jsx code from artifact here */" > frontend/src/App.jsx

cat > frontend/README.md << 'EOF'
# Baseball Stats Tracker - Frontend

React frontend built with Vite.

## Development
```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build
```bash
npm run build
```

Output in `dist/` folder
EOF

# Standalone
echo "🌐 Creating standalone version..."
mkdir -p standalone
echo "<!-- Copy standalone HTML from artifact here -->" > standalone/baseball-stats-standalone.html

# Docs
cat > docs/DEPLOYMENT.md << 'EOF'
# Deployment Guide

## Quick Deploy Options

### Backend
- **Render.com** - Free tier, easy setup
- **Railway.app** - Great developer experience
- **Heroku** - Classic PaaS option

### Frontend
- **Vercel** - Best for React (recommended)
- **Netlify** - Easy drag-and-drop
- **GitHub Pages** - Free static hosting

See full deployment guide in main README.
EOF

# Start scripts
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "Starting Baseball Stats Tracker..."

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend..."
    cd frontend && npm install && cd ..
fi

cd backend && npm start &
sleep 3
cd frontend && npm run dev &

echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
wait
EOF

chmod +x start-all.sh

cat > start-all.bat << 'EOF'
@echo off
echo Starting Baseball Stats Tracker...

if not exist "backend\node_modules" (
    cd backend && npm install && cd ..
)

if not exist "frontend\node_modules" (
    cd frontend && npm install && cd ..
)

start "Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
pause
EOF

# Create index.html for GitHub Pages
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=standalone/baseball-stats-standalone.html">
    <title>Baseball Stats Tracker</title>
</head>
<body>
    <p>Redirecting...</p>
</body>
</html>
EOF

echo ""
echo "✅ Project structure created!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Copy the code from artifacts:"
echo "   - backend/server.js (from 'Baseball Stats Backend API')"
echo "   - frontend/src/App.jsx (from 'Baseball Stats Tracker')"
echo "   - standalone/baseball-stats-standalone.html (from 'Standalone App')"
echo ""
echo "2. Create GitHub repository:"
echo "   Go to: https://github.com/new"
echo "   Name: $REPO_NAME"
echo "   Don't initialize with README"
echo ""
echo "3. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Initial commit: Baseball Stats Tracker'"
echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "   git push -u origin main"
echo ""
echo "4. Enable GitHub Pages (optional):"
echo "   Repository Settings → Pages → Source: main branch"
echo ""
echo "🎉 Your app will be live at:"
echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""

# Summary file
cat > NEXT_STEPS.txt << EOF
Baseball Stats Tracker - Setup Complete!
========================================

Your repository structure is ready at: $(pwd)

REQUIRED: Copy these files from the artifacts:
1. backend/server.js - From "Baseball Stats Backend API" artifact
2. frontend/src/App.jsx - From "Baseball Stats Tracker" artifact  
3. standalone/baseball-stats-standalone.html - From "Standalone App" artifact

GitHub Commands:
----------------
# After copying the code files above, run:

git add .
git commit -m "Initial commit: Baseball Stats Tracker"
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
git push -u origin main

Your Repository:
----------------
https://github.com/$GITHUB_USERNAME/$REPO_NAME

GitHub Pages (after enabling):
-------------------------------
https://$GITHUB_USERNAME.github.io/$REPO_NAME/

Local Development:
------------------
./start-all.sh (Mac/Linux)
start-all.bat (Windows)

Questions? Check README.md for full documentation!
EOF

cat NEXT_STEPS.txt