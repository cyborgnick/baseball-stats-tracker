// Baseball Statistics Tracker - Backend API
// Node.js + Express + SQLite Database

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Create uploads directory
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimeType);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Database setup
const db = new sqlite3.Database('./baseball_stats.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        profile_pic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teams table
    db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        league TEXT NOT NULL,
        season INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Players table
    db.run(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        number TEXT NOT NULL,
        position TEXT NOT NULL,
        profile_pic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    // Games table
    db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        date DATE NOT NULL,
        opponent TEXT NOT NULL,
        at_bats INTEGER DEFAULT 0,
        hits INTEGER DEFAULT 0,
        runs INTEGER DEFAULT 0,
        rbis INTEGER DEFAULT 0,
        walks INTEGER DEFAULT 0,
        strikeouts INTEGER DEFAULT 0,
        stolen_bases INTEGER DEFAULT 0,
        errors INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized');
  });
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/v1/auth/register', upload.single('profilePic'), async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
      'INSERT INTO users (email, password_hash, name, profile_pic) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, profilePic],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
          message: 'User created successfully',
          user: {
            id: this.lastID,
            email,
            name,
            profilePic
          },
          token
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePic: user.profile_pic
        },
        token
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name, profile_pic FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// ==================== TEAM ROUTES ====================

// Create team
app.post('/api/v1/teams', authenticateToken, (req, res) => {
  const { name, league, season } = req.body;

  if (!name || !league || !season) {
    return res.status(400).json({ error: 'Name, league, and season are required' });
  }

  db.run(
    'INSERT INTO teams (user_id, name, league, season) VALUES (?, ?, ?, ?)',
    [req.user.id, name, league, season],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        userId: req.user.id,
        name,
        league,
        season
      });
    }
  );
});

// Get all teams for current user
app.get('/api/v1/teams', authenticateToken, (req, res) => {
  db.all('SELECT * FROM teams WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, teams) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(teams);
  });
});

// Get single team with players
app.get('/api/v1/teams/:id', authenticateToken, (req, res) => {
  const teamId = req.params.id;

  db.get('SELECT * FROM teams WHERE id = ? AND user_id = ?', [teamId, req.user.id], (err, team) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    db.all('SELECT * FROM players WHERE team_id = ?', [teamId], (err, players) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ ...team, players });
    });
  });
});

// Update team
app.put('/api/v1/teams/:id', authenticateToken, (req, res) => {
  const { name, league, season } = req.body;
  const teamId = req.params.id;

  db.run(
    'UPDATE teams SET name = ?, league = ?, season = ? WHERE id = ? AND user_id = ?',
    [name, league, season, teamId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }
      res.json({ message: 'Team updated successfully' });
    }
  );
});

// Delete team
app.delete('/api/v1/teams/:id', authenticateToken, (req, res) => {
  const teamId = req.params.id;

  db.run('DELETE FROM teams WHERE id = ? AND user_id = ?', [teamId, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ message: 'Team deleted successfully' });
  });
});

// ==================== PLAYER ROUTES ====================

// Create player
app.post('/api/v1/players', authenticateToken, upload.single('profilePic'), (req, res) => {
  const { teamId, name, number, position } = req.body;

  if (!teamId || !name || !number || !position) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Verify team belongs to user
  db.get('SELECT * FROM teams WHERE id = ? AND user_id = ?', [teamId, req.user.id], (err, team) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!team) {
      return res.status(403).json({ error: 'Team not found or access denied' });
    }

    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
      'INSERT INTO players (team_id, name, number, position, profile_pic) VALUES (?, ?, ?, ?, ?)',
      [teamId, name, number, position, profilePic],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({
          id: this.lastID,
          teamId,
          name,
          number,
          position,
          profilePic
        });
      }
    );
  });
});

// Get all players for a team
app.get('/api/v1/teams/:teamId/players', authenticateToken, (req, res) => {
  const teamId = req.params.teamId;

  // Verify team belongs to user
  db.get('SELECT * FROM teams WHERE id = ? AND user_id = ?', [teamId, req.user.id], (err, team) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!team) {
      return res.status(403).json({ error: 'Team not found or access denied' });
    }

    db.all('SELECT * FROM players WHERE team_id = ?', [teamId], (err, players) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(players);
    });
  });
});

// Get player with stats
app.get('/api/v1/players/:id', authenticateToken, (req, res) => {
  const playerId = req.params.id;

  db.get(`
    SELECT p.*, t.user_id 
    FROM players p 
    JOIN teams t ON p.team_id = t.id 
    WHERE p.id = ?
  `, [playerId], (err, player) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    if (player.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.all('SELECT * FROM games WHERE player_id = ? ORDER BY date DESC', [playerId], (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate stats
      const stats = games.reduce((acc, game) => ({
        atBats: acc.atBats + game.at_bats,
        hits: acc.hits + game.hits,
        runs: acc.runs + game.runs,
        rbis: acc.rbis + game.rbis,
        walks: acc.walks + game.walks,
        strikeouts: acc.strikeouts + game.strikeouts,
        stolenBases: acc.stolenBases + game.stolen_bases,
        errors: acc.errors + game.errors
      }), { atBats: 0, hits: 0, runs: 0, rbis: 0, walks: 0, strikeouts: 0, stolenBases: 0, errors: 0 });

      const avg = stats.atBats > 0 ? (stats.hits / stats.atBats).toFixed(3) : '.000';
      const obp = (stats.atBats + stats.walks) > 0 
        ? ((stats.hits + stats.walks) / (stats.atBats + stats.walks)).toFixed(3) 
        : '.000';

      res.json({
        player: {
          id: player.id,
          teamId: player.team_id,
          name: player.name,
          number: player.number,
          position: player.position,
          profilePic: player.profile_pic
        },
        stats: { ...stats, avg, obp, games: games.length },
        games
      });
    });
  });
});

// Delete player
app.delete('/api/v1/players/:id', authenticateToken, (req, res) => {
  const playerId = req.params.id;

  db.get(`
    SELECT p.*, t.user_id 
    FROM players p 
    JOIN teams t ON p.team_id = t.id 
    WHERE p.id = ?
  `, [playerId], (err, player) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    if (player.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run('DELETE FROM players WHERE id = ?', [playerId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Player deleted successfully' });
    });
  });
});

// ==================== GAME STATS ROUTES ====================

// Add game stats
app.post('/api/v1/games', authenticateToken, (req, res) => {
  const { playerId, date, opponent, atBats, hits, runs, rbis, walks, strikeouts, stolenBases, errors } = req.body;

  if (!playerId || !date || !opponent) {
    return res.status(400).json({ error: 'Player ID, date, and opponent are required' });
  }

  // Verify player belongs to user's team
  db.get(`
    SELECT p.*, t.user_id 
    FROM players p 
    JOIN teams t ON p.team_id = t.id 
    WHERE p.id = ?
  `, [playerId], (err, player) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    if (player.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run(
      `INSERT INTO games (player_id, date, opponent, at_bats, hits, runs, rbis, walks, strikeouts, stolen_bases, errors) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [playerId, date, opponent, atBats || 0, hits || 0, runs || 0, rbis || 0, walks || 0, strikeouts || 0, stolenBases || 0, errors || 0],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({
          id: this.lastID,
          playerId,
          date,
          opponent,
          atBats,
          hits,
          runs,
          rbis,
          walks,
          strikeouts,
          stolenBases,
          errors
        });
      }
    );
  });
});

// Get games for a player
app.get('/api/v1/players/:playerId/games', authenticateToken, (req, res) => {
  const playerId = req.params.playerId;

  db.get(`
    SELECT p.*, t.user_id 
    FROM players p 
    JOIN teams t ON p.team_id = t.id 
    WHERE p.id = ?
  `, [playerId], (err, player) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    if (player.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.all('SELECT * FROM games WHERE player_id = ? ORDER BY date DESC', [playerId], (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(games);
    });
  });
});

// Update game stats
app.put('/api/v1/games/:id', authenticateToken, (req, res) => {
  const gameId = req.params.id;
  const { date, opponent, atBats, hits, runs, rbis, walks, strikeouts, stolenBases, errors } = req.body;

  db.get(`
    SELECT g.*, p.id as player_id, t.user_id 
    FROM games g 
    JOIN players p ON g.player_id = p.id 
    JOIN teams t ON p.team_id = t.id 
    WHERE g.id = ?
  `, [gameId], (err, game) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run(
      `UPDATE games SET date = ?, opponent = ?, at_bats = ?, hits = ?, runs = ?, rbis = ?, 
       walks = ?, strikeouts = ?, stolen_bases = ?, errors = ? WHERE id = ?`,
      [date, opponent, atBats, hits, runs, rbis, walks, strikeouts, stolenBases, errors, gameId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Game updated successfully' });
      }
    );
  });
});

// Delete game
app.delete('/api/v1/games/:id', authenticateToken, (req, res) => {
  const gameId = req.params.id;

  db.get(`
    SELECT g.*, p.id as player_id, t.user_id 
    FROM games g 
    JOIN players p ON g.player_id = p.id 
    JOIN teams t ON p.team_id = t.id 
    WHERE g.id = ?
  `, [gameId], (err, game) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run('DELETE FROM games WHERE id = ?', [gameId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Game deleted successfully' });
    });
  });
});

// ==================== PUBLIC API ENDPOINTS FOR SHARING ====================

// Public endpoint to get team stats (shareable)
app.get('/api/v1/public/teams/:id', (req, res) => {
  const teamId = req.params.id;

  db.get('SELECT * FROM teams WHERE id = ?', [teamId], (err, team) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    db.all('SELECT * FROM players WHERE team_id = ?', [teamId], (err, players) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const playerPromises = players.map(player => {
        return new Promise((resolve) => {
          db.all('SELECT * FROM games WHERE player_id = ?', [player.id], (err, games) => {
            if (err) {
              resolve({ player, stats: null, games: [] });
              return;
            }

            const stats = games.reduce((acc, game) => ({
              atBats: acc.atBats + game.at_bats,
              hits: acc.hits + game.hits,
              runs: acc.runs + game.runs,
              rbis: acc.rbis + game.rbis,
              walks: acc.walks + game.walks,
              strikeouts: acc.strikeouts + game.strikeouts,
              stolenBases: acc.stolenBases + game.stolen_bases,
              errors: acc.errors + game.errors
            }), { atBats: 0, hits: 0, runs: 0, rbis: 0, walks: 0, strikeouts: 0, stolenBases: 0, errors: 0 });

            const avg = stats.atBats > 0 ? (stats.hits / stats.atBats).toFixed(3) : '.000';
            const obp = (stats.atBats + stats.walks) > 0 
              ? ((stats.hits + stats.walks) / (stats.atBats + stats.walks)).toFixed(3) 
              : '.000';

            resolve({ player, stats: { ...stats, avg, obp, games: games.length } });
          });
        });
      });

      Promise.all(playerPromises).then(playersWithStats => {
        res.json({
          team,
          players: playersWithStats
        });
      });
    });
  });
});

// Public endpoint to get player stats (shareable)
app.get('/api/v1/public/players/:id', (req, res) => {
  const playerId = req.params.id;

  db.get('SELECT * FROM players WHERE id = ?', [playerId], (err, player) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    db.all('SELECT * FROM games WHERE player_id = ? ORDER BY date DESC', [playerId], (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const stats = games.reduce((acc, game) => ({
        atBats: acc.atBats + game.at_bats,
        hits: acc.hits + game.hits,
        runs: acc.runs + game.runs,
        rbis: acc.rbis + game.rbis,
        walks: acc.walks + game.walks,
        strikeouts: acc.strikeouts + game.strikeouts,
        stolenBases: acc.stolenBases + game.stolen_bases,
        errors: acc.errors + game.errors
      }), { atBats: 0, hits: 0, runs: 0, rbis: 0, walks: 0, strikeouts: 0, stolenBases: 0, errors: 0 });

      const avg = stats.atBats > 0 ? (stats.hits / stats.atBats).toFixed(3) : '.000';
      const obp = (stats.atBats + stats.walks) > 0 
        ? ((stats.hits + stats.walks) / (stats.atBats + stats.walks)).toFixed(3) 
        : '.000';

      res.json({
        player,
        stats: { ...stats, avg, obp, games: games.length },
        games
      });
    });
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'Baseball Stats API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Baseball Stats API running on port ${PORT}`);
  console.log(`API Documentation:`);
  console.log(`  POST   /api/v1/auth/register - Register new user`);
  console.log(`  POST   /api/v1/auth/login - Login`);
  console.log(`  GET    /api/v1/auth/me - Get current user`);
  console.log(`  POST   /api/v1/teams - Create team`);
  console.log(`  GET    /api/v1/teams - Get all teams`);
  console.log(`  GET    /api/v1/teams/:id - Get team with players`);
  console.log(`  PUT    /api/v1/teams/:id - Update team`);
  console.log(`  DELETE /api/v1/teams/:id - Delete team`);
  console.log(`  POST   /api/v1/players - Create player`);
  console.log(`  GET    /api/v1/teams/:teamId/players - Get team players`);
  console.log(`  GET    /api/v1/players/:id - Get player with stats`);
  console.log(`  DELETE /api/v1/players/:id - Delete player`);
  console.log(`  POST   /api/v1/games - Add game stats`);
  console.log(`  GET    /api/v1/players/:playerId/games - Get player games`);
  console.log(`  PUT    /api/v1/games/:id - Update game`);
  console.log(`  DELETE /api/v1/games/:id - Delete game`);
  console.log(`  GET    /api/v1/public/teams/:id - Public team stats`);
  console.log(`  GET    /api/v1/public/players/:id - Public player stats`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});