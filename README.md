# ⚾ Baseball Stats Tracker

A comprehensive baseball statistics tracking application with user authentication, team management, and advanced analytics.

![Baseball Stats Tracker](https://img.shields.io/badge/Baseball-Stats%20Tracker-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14-brightgreen)

## ✨ Features

- 🔐 **User Authentication** - Secure signup/login with JWT tokens
- 👥 **Team Management** - Create and manage multiple teams
- ⚾ **Player Tracking** - Comprehensive player profiles with photos
- 📊 **Advanced Statistics** - 30+ stats including AVG, OBP, SLG, OPS, ERA, WHIP
- 📈 **Analytics** - Automatic calculation of batting and pitching metrics
- 🔗 **Public API** - Share statistics via shareable URLs
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 💾 **Multiple Storage Options** - SQLite database or browser localStorage

## 🎯 Quick Start Options

### Option 1: Standalone (No Installation) ⚡
Perfect for trying out the app instantly!

1. Download [`standalone/baseball-stats-standalone.html`](standalone/baseball-stats-standalone.html)
2. Open in your web browser
3. Start tracking stats immediately!

**Features:** All core functionality with browser localStorage

### Option 2: Full Stack Application 🏗️
For production use with database persistence.

#### Prerequisites
- [Node.js](https://nodejs.org/) v14 or higher
- npm (comes with Node.js)

#### Installation

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set your JWT_SECRET
npm start
```
Backend runs on `http://localhost:3001`

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

**Quick Start Script:**
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/baseball-stats-tracker.git
cd baseball-stats-tracker

# Start both servers (Mac/Linux)
chmod +x start-all.sh
./start-all.sh

# Windows
start-all.bat
```

## 📖 Documentation

- [Backend API Documentation](backend/README.md)
- [Frontend Development Guide](frontend/README.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🎮 Usage

1. **Sign Up** - Create your account with email and password
2. **Create Team** - Add your team with league and season info
3. **Add Players** - Create player profiles with positions and numbers
4. **Record Games** - Enter detailed game statistics
5. **View Analytics** - Automatically calculated stats and metrics

## 📊 Statistics Tracked

### Batting
- At Bats, Hits, Doubles, Triples, Home Runs
- Runs, RBIs, Walks, Strikeouts
- Stolen Bases, Caught Stealing
- Hit By Pitch, Sacrifice Flies/Bunts, GIDP
- **Calculated:** AVG, OBP, SLG, OPS, Total Bases

### Fielding
- Putouts, Assists, Errors

### Pitching
- Innings Pitched, Pitches Thrown
- Strikeouts, Walks, Hits Allowed
- Runs Allowed, Earned Runs, Home Runs Allowed
- **Calculated:** ERA, WHIP, K/9, BB/9

## 🛠️ Tech Stack

**Backend:**
- Node.js & Express
- SQLite3 Database
- JWT Authentication
- Bcrypt Encryption
- Multer (File Uploads)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Lucide React Icons

## 🚀 Deployment

### Deploy Backend

**Render.com (Free):**
1. Fork this repository
2. Create new Web Service on Render
3. Connect your GitHub repo
4. Set environment variables
5. Deploy!

**Railway.app:**
```bash
railway login
railway init
railway up
```

### Deploy Frontend

**Vercel (Recommended):**
```bash
cd frontend
npm run build
vercel --prod
```

**Netlify:**
```bash
cd frontend
npm run build
# Drag dist/ folder to Netlify
```

**GitHub Pages:**
```bash
cd frontend
npm run build
# Deploy dist/ folder to gh-pages branch
```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and Express
- Icons by Lucide
- Styling with Tailwind CSS

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/YOUR_USERNAME/baseball-stats-tracker](https://github.com/YOUR_USERNAME/baseball-stats-tracker)

## ⭐ Star History

If you find this project useful, please consider giving it a star!

[![Star History Chart](https://api.star-history.com/svg?repos=YOUR_USERNAME/baseball-stats-tracker&type=Date)](https://star-history.com/#YOUR_USERNAME/baseball-stats-tracker&Date)

---

**Made with ⚾ and ❤️**