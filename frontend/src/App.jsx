import React, { useState, useEffect } from 'react';
import { Users, UserPlus, TrendingUp, Share2, Plus, Trash2, BarChart3, Camera, AlertCircle } from 'lucide-react';

const BaseballStatsApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for stored auth on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      setAuthToken(token);
      setCurrentUser(JSON.parse(user));
      setCurrentView('dashboard');
      loadUserData(token);
    }
  }, []);

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    profilePic: null
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    league: '',
    season: new Date().getFullYear()
  });

  const [playerForm, setPlayerForm] = useState({
    name: '',
    number: '',
    position: '',
    teamId: '',
    profilePic: null
  });

  const [gameForm, setGameForm] = useState({
    playerId: '',
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    atBats: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    runs: 0,
    rbis: 0,
    walks: 0,
    strikeouts: 0,
    stolenBases: 0,
    caughtStealing: 0,
    hitByPitch: 0,
    sacrificeFlies: 0,
    sacrificeBunts: 0,
    groundIntoDP: 0,
    errors: 0,
    putouts: 0,
    assists: 0,
    // Pitching stats
    inningsPitched: 0,
    pitchesThrown: 0,
    strikeoutsPitched: 0,
    walksAllowed: 0,
    hitsAllowed: 0,
    runsAllowed: 0,
    earnedRuns: 0,
    homeRunsAllowed: 0
  });

  // Load all user data
  const loadUserData = async (token) => {
    setLoading(true);
    try {
      const teamsData = await fetchTeams(token);
      setTeams(teamsData);
      
      const allPlayers = [];
      const allGames = [];
      
      for (const team of teamsData) {
        const teamPlayers = await fetchTeamPlayers(token, team.id);
        allPlayers.push(...teamPlayers);
        
        for (const player of teamPlayers) {
          const playerGames = await fetchPlayerGames(token, player.id);
          allGames.push(...playerGames);
        }
      }
      
      setPlayers(allPlayers);
      setGames(allGames);
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  // API call helpers
  const fetchTeams = async (token) => {
    const response = await fetch('/api/v1/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  };

  const fetchTeamPlayers = async (token, teamId) => {
    const response = await fetch(`/api/v1/teams/${teamId}/players`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return response.json();
  };

  const fetchPlayerGames = async (token, playerId) => {
    const response = await fetch(`/api/v1/players/${playerId}/games`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return response.json();
  };

  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (formType === 'auth') {
          setAuthForm({ ...authForm, profilePic: reader.result });
        } else if (formType === 'player') {
          setPlayerForm({ ...playerForm, profilePic: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignup = async () => {
    if (!authForm.email || !authForm.name || !authForm.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Try API first
      const formData = new FormData();
      formData.append('email', authForm.email);
      formData.append('password', authForm.password);
      formData.append('name', authForm.name);
      if (authForm.profilePic) {
        const blob = await (await fetch(authForm.profilePic)).blob();
        formData.append('profilePic', blob, 'profile.jpg');
      }

      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setCurrentView('dashboard');
        await loadUserData(data.token);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed');
      }
    } catch (err) {
      // Fallback to local storage
      console.log('API not available, using local storage');
      const newUser = {
        id: Date.now().toString(),
        email: authForm.email,
        name: authForm.name,
        profilePic: authForm.profilePic,
        createdAt: new Date().toISOString()
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setCurrentView('dashboard');
    }
    
    setLoading(false);
    setAuthForm({ email: '', password: '', name: '', profilePic: null });
  };

  const handleLogin = async () => {
    if (!authForm.email || !authForm.password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setCurrentView('dashboard');
        await loadUserData(data.token);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      // Fallback to local check
      const user = users.find(u => u.email === authForm.email);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentView('dashboard');
      } else {
        setError('User not found. Please sign up.');
      }
    }

    setLoading(false);
    setAuthForm({ email: '', password: '', name: '', profilePic: null });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setTeams([]);
    setPlayers([]);
    setGames([]);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setCurrentView('login');
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name || !teamForm.league) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (authToken) {
        const response = await fetch('/api/v1/teams', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: teamForm.name,
            league: teamForm.league,
            season: teamForm.season
          })
        });

        if (response.ok) {
          const newTeam = await response.json();
          setTeams([...teams, newTeam]);
        } else {
          throw new Error('Failed to create team');
        }
      } else {
        throw new Error('No auth token');
      }
    } catch (err) {
      // Fallback
      const newTeam = {
        id: Date.now().toString(),
        ...teamForm,
        userId: currentUser.id,
        createdAt: new Date().toISOString()
      };
      setTeams([...teams, newTeam]);
    }

    setLoading(false);
    setTeamForm({ name: '', league: '', season: new Date().getFullYear() });
    setCurrentView('dashboard');
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      if (authToken) {
        await fetch(`/api/v1/teams/${teamId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      }
    } catch (err) {
      console.log('Using local delete');
    }
    
    setTeams(teams.filter(t => t.id !== teamId));
    setPlayers(players.filter(p => p.teamId !== teamId));
  };

  const handleCreatePlayer = async () => {
    if (!playerForm.name || !playerForm.number || !playerForm.position || !playerForm.teamId) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (authToken) {
        const formData = new FormData();
        formData.append('teamId', playerForm.teamId);
        formData.append('name', playerForm.name);
        formData.append('number', playerForm.number);
        formData.append('position', playerForm.position);
        if (playerForm.profilePic) {
          const blob = await (await fetch(playerForm.profilePic)).blob();
          formData.append('profilePic', blob, 'player.jpg');
        }

        const response = await fetch('/api/v1/players', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        });

        if (response.ok) {
          const newPlayer = await response.json();
          setPlayers([...players, newPlayer]);
        } else {
          throw new Error('Failed to create player');
        }
      } else {
        throw new Error('No auth token');
      }
    } catch (err) {
      // Fallback
      const newPlayer = {
        id: Date.now().toString(),
        ...playerForm,
        createdAt: new Date().toISOString()
      };
      setPlayers([...players, newPlayer]);
    }

    setLoading(false);
    setPlayerForm({ name: '', number: '', position: '', teamId: '', profilePic: null });
    setCurrentView('dashboard');
  };

  const handleDeletePlayer = async (playerId) => {
    try {
      if (authToken) {
        await fetch(`/api/v1/players/${playerId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      }
    } catch (err) {
      console.log('Using local delete');
    }

    setPlayers(players.filter(p => p.id !== playerId));
    setGames(games.filter(g => g.playerId !== playerId));
  };

  const handleAddGame = async () => {
    if (!gameForm.playerId || !gameForm.opponent) {
      setError('Please fill in required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (authToken) {
        const response = await fetch('/api/v1/games', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            playerId: gameForm.playerId,
            date: gameForm.date,
            opponent: gameForm.opponent,
            atBats: Number(gameForm.atBats),
            hits: Number(gameForm.hits),
            runs: Number(gameForm.runs),
            rbis: Number(gameForm.rbis),
            walks: Number(gameForm.walks),
            strikeouts: Number(gameForm.strikeouts),
            stolenBases: Number(gameForm.stolenBases),
            errors: Number(gameForm.errors)
          })
        });

        if (response.ok) {
          const newGame = await response.json();
          setGames([...games, newGame]);
        } else {
          throw new Error('Failed to add game');
        }
      } else {
        throw new Error('No auth token');
      }
    } catch (err) {
      // Fallback
      const newGame = {
        id: Date.now().toString(),
        ...gameForm,
        createdAt: new Date().toISOString()
      };
      setGames([...games, newGame]);
    }

    setLoading(false);
    setGameForm({
      playerId: '',
      date: new Date().toISOString().split('T')[0],
      opponent: '',
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      runs: 0,
      rbis: 0,
      walks: 0,
      strikeouts: 0,
      stolenBases: 0,
      caughtStealing: 0,
      hitByPitch: 0,
      sacrificeFlies: 0,
      sacrificeBunts: 0,
      groundIntoDP: 0,
      errors: 0,
      putouts: 0,
      assists: 0,
      inningsPitched: 0,
      pitchesThrown: 0,
      strikeoutsPitched: 0,
      walksAllowed: 0,
      hitsAllowed: 0,
      runsAllowed: 0,
      earnedRuns: 0,
      homeRunsAllowed: 0
    });
    setCurrentView('dashboard');
  };

  const calculatePlayerStats = (playerId) => {
    const playerGames = games.filter(g => g.playerId === playerId);
    if (playerGames.length === 0) return null;

    const totals = playerGames.reduce((acc, game) => ({
      atBats: acc.atBats + Number(game.atBats || game.at_bats || 0),
      hits: acc.hits + Number(game.hits || 0),
      doubles: acc.doubles + Number(game.doubles || 0),
      triples: acc.triples + Number(game.triples || 0),
      homeRuns: acc.homeRuns + Number(game.homeRuns || game.home_runs || 0),
      runs: acc.runs + Number(game.runs || 0),
      rbis: acc.rbis + Number(game.rbis || 0),
      walks: acc.walks + Number(game.walks || 0),
      strikeouts: acc.strikeouts + Number(game.strikeouts || 0),
      stolenBases: acc.stolenBases + Number(game.stolenBases || game.stolen_bases || 0),
      caughtStealing: acc.caughtStealing + Number(game.caughtStealing || game.caught_stealing || 0),
      hitByPitch: acc.hitByPitch + Number(game.hitByPitch || game.hit_by_pitch || 0),
      sacrificeFlies: acc.sacrificeFlies + Number(game.sacrificeFlies || game.sacrifice_flies || 0),
      sacrificeBunts: acc.sacrificeBunts + Number(game.sacrificeBunts || game.sacrifice_bunts || 0),
      groundIntoDP: acc.groundIntoDP + Number(game.groundIntoDP || game.ground_into_dp || 0),
      errors: acc.errors + Number(game.errors || 0),
      putouts: acc.putouts + Number(game.putouts || 0),
      assists: acc.assists + Number(game.assists || 0),
      // Pitching
      inningsPitched: acc.inningsPitched + Number(game.inningsPitched || game.innings_pitched || 0),
      pitchesThrown: acc.pitchesThrown + Number(game.pitchesThrown || game.pitches_thrown || 0),
      strikeoutsPitched: acc.strikeoutsPitched + Number(game.strikeoutsPitched || game.strikeouts_pitched || 0),
      walksAllowed: acc.walksAllowed + Number(game.walksAllowed || game.walks_allowed || 0),
      hitsAllowed: acc.hitsAllowed + Number(game.hitsAllowed || game.hits_allowed || 0),
      runsAllowed: acc.runsAllowed + Number(game.runsAllowed || game.runs_allowed || 0),
      earnedRuns: acc.earnedRuns + Number(game.earnedRuns || game.earned_runs || 0),
      homeRunsAllowed: acc.homeRunsAllowed + Number(game.homeRunsAllowed || game.home_runs_allowed || 0)
    }), { 
      atBats: 0, hits: 0, doubles: 0, triples: 0, homeRuns: 0, runs: 0, rbis: 0, 
      walks: 0, strikeouts: 0, stolenBases: 0, caughtStealing: 0, hitByPitch: 0,
      sacrificeFlies: 0, sacrificeBunts: 0, groundIntoDP: 0, errors: 0, putouts: 0, assists: 0,
      inningsPitched: 0, pitchesThrown: 0, strikeoutsPitched: 0, walksAllowed: 0,
      hitsAllowed: 0, runsAllowed: 0, earnedRuns: 0, homeRunsAllowed: 0
    });

    // Batting calculations
    const singles = totals.hits - totals.doubles - totals.triples - totals.homeRuns;
    const totalBases = singles + (totals.doubles * 2) + (totals.triples * 3) + (totals.homeRuns * 4);
    const avg = totals.atBats > 0 ? (totals.hits / totals.atBats).toFixed(3) : '.000';
    const obp = (totals.atBats + totals.walks + totals.hitByPitch + totals.sacrificeFlies) > 0 
      ? ((totals.hits + totals.walks + totals.hitByPitch) / (totals.atBats + totals.walks + totals.hitByPitch + totals.sacrificeFlies)).toFixed(3) 
      : '.000';
    const slg = totals.atBats > 0 ? (totalBases / totals.atBats).toFixed(3) : '.000';
    const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3);
    
    // Pitching calculations
    const era = totals.inningsPitched > 0 ? ((totals.earnedRuns * 9) / totals.inningsPitched).toFixed(2) : '0.00';
    const whip = totals.inningsPitched > 0 ? ((totals.walksAllowed + totals.hitsAllowed) / totals.inningsPitched).toFixed(2) : '0.00';
    const k9 = totals.inningsPitched > 0 ? ((totals.strikeoutsPitched * 9) / totals.inningsPitched).toFixed(2) : '0.00';
    const bb9 = totals.inningsPitched > 0 ? ((totals.walksAllowed * 9) / totals.inningsPitched).toFixed(2) : '0.00';

    return { 
      ...totals, 
      avg, 
      obp, 
      slg, 
      ops,
      totalBases,
      era,
      whip,
      k9,
      bb9,
      games: playerGames.length 
    };
  };

  const handleShare = (type, id) => {
    const shareUrl = `${window.location.origin}/api/v1/public/${type}/${id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert(`Share URL copied to clipboard!\n\n${shareUrl}\n\nAnyone can access this URL to view the ${type} statistics.`);
    } else {
      alert(`Share this URL to view ${type} statistics:\n\n${shareUrl}`);
    }
  };

  const renderLoginSignup = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <BarChart3 className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Baseball Stats Tracker</h1>
          <p className="text-gray-600 mt-2">Track player and team statistics</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Full Name (for signup)"
            value={authForm.name}
            onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <label className="flex flex-col items-center cursor-pointer">
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Upload Profile Picture</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'auth')}
                className="hidden"
              />
            </label>
            {authForm.profilePic && (
              <img src={authForm.profilePic} alt="Preview" className="w-20 h-20 rounded-full mx-auto mt-3 object-cover" />
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
            <button
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const userTeams = teams.filter(t => t.userId === currentUser.id || t.user_id === currentUser.id);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser.profilePic && (
                <img src={currentUser.profilePic} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
              )}
              <div>
                <h2 className="font-bold text-gray-800">{currentUser.name}</h2>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          {loading && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-center">
              Loading...
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setCurrentView('createTeam')}
              className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-6 h-6" />
              <span className="font-semibold">Create Team</span>
            </button>
            <button
              onClick={() => setCurrentView('createPlayer')}
              className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <UserPlus className="w-6 h-6" />
              <span className="font-semibold">Add Player</span>
            </button>
            <button
              onClick={() => setCurrentView('addGame')}
              className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="font-semibold">Record Game</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">My Teams</h3>
            {userTeams.length === 0 ? (
              <p className="text-gray-600">No teams yet. Create your first team!</p>
            ) : (
              <div className="space-y-4">
                {userTeams.map(team => {
                  const teamPlayers = players.filter(p => p.teamId === team.id || p.team_id === team.id);
                  return (
                    <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">{team.name}</h4>
                          <p className="text-gray-600">{team.league} - {team.season}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShare('teams', team.id)}
                            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            title="Share team stats"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teamPlayers.map(player => {
                          const stats = calculatePlayerStats(player.id);
                          return (
                            <div key={player.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center gap-3 mb-2">
                                {player.profilePic || player.profile_pic ? (
                                  <img src={player.profilePic || player.profile_pic} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                    #{player.number}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-gray-800">{player.name}</p>
                                  <p className="text-sm text-gray-600">{player.position}</p>
                                </div>
                              </div>
                              {stats && (
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p className="font-semibold">Batting</p>
                                  <p>AVG: {stats.avg} | OBP: {stats.obp} | SLG: {stats.slg}</p>
                                  <p>OPS: {stats.ops} | HR: {stats.homeRuns} | RBI: {stats.rbis}</p>
                                  <p>H: {stats.hits} | R: {stats.runs} | SB: {stats.stolenBases}</p>
                                  {stats.inningsPitched > 0 && (
                                    <>
                                      <p className="font-semibold mt-2">Pitching</p>
                                      <p>ERA: {stats.era} | WHIP: {stats.whip}</p>
                                      <p>IP: {stats.inningsPitched} | K: {stats.strikeoutsPitched}</p>
                                    </>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">Games: {stats.games}</p>
                                </div>
                              )}
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleShare('players', player.id)}
                                  className="flex-1 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                >
                                  Share
                                </button>
                                <button
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="flex-1 text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateTeam = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Team</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Team Name"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="League"
              value={teamForm.league}
              onChange={(e) => setTeamForm({ ...teamForm, league: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Season"
              value={teamForm.season}
              onChange={(e) => setTeamForm({ ...teamForm, season: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleCreateTeam}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreatePlayer = () => {
    const userTeams = teams.filter(t => t.userId === currentUser.id || t.user_id === currentUser.id);
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Player</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Player Name"
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Jersey Number"
                value={playerForm.number}
                onChange={(e) => setPlayerForm({ ...playerForm, number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Position (e.g., P, C, 1B, SS)"
                value={playerForm.position}
                onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={playerForm.teamId}
                onChange={(e) => setPlayerForm({ ...playerForm, teamId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Team</option>
                {userTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <label className="flex flex-col items-center cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Upload Player Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'player')}
                    className="hidden"
                  />
                </label>
                {playerForm.profilePic && (
                  <img src={playerForm.profilePic} alt="Preview" className="w-24 h-24 rounded-full mx-auto mt-3 object-cover" />
                )}
              </div>

              <button
                onClick={handleCreatePlayer}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddGame = () => {
    const allPlayers = players.filter(p => {
      const teamId = p.teamId || p.team_id;
      return teams.find(t => t.id === teamId && (t.userId === currentUser.id || t.user_id === currentUser.id));
    });
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Record Game Statistics</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">Game Info</h3>
                <select
                  value={gameForm.playerId}
                  onChange={(e) => setGameForm({ ...gameForm, playerId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Player</option>
                  {allPlayers.map(player => {
                    const teamId = player.teamId || player.team_id;
                    const team = teams.find(t => t.id === teamId);
                    return (
                      <option key={player.id} value={player.id}>
                        {player.name} - #{player.number} ({team?.name})
                      </option>
                    );
                  })}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={gameForm.date}
                    onChange={(e) => setGameForm({ ...gameForm, date: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Opponent"
                    value={gameForm.opponent}
                    onChange={(e) => setGameForm({ ...gameForm, opponent: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Batting Stats */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">Batting Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">At Bats</label>
                    <input
                      type="number"
                      value={gameForm.atBats}
                      onChange={(e) => setGameForm({ ...gameForm, atBats: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hits</label>
                    <input
                      type="number"
                      value={gameForm.hits}
                      onChange={(e) => setGameForm({ ...gameForm, hits: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Doubles (2B)</label>
                    <input
                      type="number"
                      value={gameForm.doubles}
                      onChange={(e) => setGameForm({ ...gameForm, doubles: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Triples (3B)</label>
                    <input
                      type="number"
                      value={gameForm.triples}
                      onChange={(e) => setGameForm({ ...gameForm, triples: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Home Runs</label>
                    <input
                      type="number"
                      value={gameForm.homeRuns}
                      onChange={(e) => setGameForm({ ...gameForm, homeRuns: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Runs</label>
                    <input
                      type="number"
                      value={gameForm.runs}
                      onChange={(e) => setGameForm({ ...gameForm, runs: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">RBIs</label>
                    <input
                      type="number"
                      value={gameForm.rbis}
                      onChange={(e) => setGameForm({ ...gameForm, rbis: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Walks (BB)</label>
                    <input
                      type="number"
                      value={gameForm.walks}
                      onChange={(e) => setGameForm({ ...gameForm, walks: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Strikeouts</label>
                    <input
                      type="number"
                      value={gameForm.strikeouts}
                      onChange={(e) => setGameForm({ ...gameForm, strikeouts: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stolen Bases</label>
                    <input
                      type="number"
                      value={gameForm.stolenBases}
                      onChange={(e) => setGameForm({ ...gameForm, stolenBases: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Caught Stealing</label>
                    <input
                      type="number"
                      value={gameForm.caughtStealing}
                      onChange={(e) => setGameForm({ ...gameForm, caughtStealing: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hit By Pitch</label>
                    <input
                      type="number"
                      value={gameForm.hitByPitch}
                      onChange={(e) => setGameForm({ ...gameForm, hitByPitch: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sac Flies</label>
                    <input
                      type="number"
                      value={gameForm.sacrificeFlies}
                      onChange={(e) => setGameForm({ ...gameForm, sacrificeFlies: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sac Bunts</label>
                    <input
                      type="number"
                      value={gameForm.sacrificeBunts}
                      onChange={(e) => setGameForm({ ...gameForm, sacrificeBunts: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">GIDP</label>
                    <input
                      type="number"
                      value={gameForm.groundIntoDP}
                      onChange={(e) => setGameForm({ ...gameForm, groundIntoDP: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fielding Stats */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">Fielding Statistics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Putouts</label>
                    <input
                      type="number"
                      value={gameForm.putouts}
                      onChange={(e) => setGameForm({ ...gameForm, putouts: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Assists</label>
                    <input
                      type="number"
                      value={gameForm.assists}
                      onChange={(e) => setGameForm({ ...gameForm, assists: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Errors</label>
                    <input
                      type="number"
                      value={gameForm.errors}
                      onChange={(e) => setGameForm({ ...gameForm, errors: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pitching Stats */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">Pitching Statistics (Optional)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Innings Pitched</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gameForm.inningsPitched}
                      onChange={(e) => setGameForm({ ...gameForm, inningsPitched: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Pitches Thrown</label>
                    <input
                      type="number"
                      value={gameForm.pitchesThrown}
                      onChange={(e) => setGameForm({ ...gameForm, pitchesThrown: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Strikeouts</label>
                    <input
                      type="number"
                      value={gameForm.strikeoutsPitched}
                      onChange={(e) => setGameForm({ ...gameForm, strikeoutsPitched: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Walks Allowed</label>
                    <input
                      type="number"
                      value={gameForm.walksAllowed}
                      onChange={(e) => setGameForm({ ...gameForm, walksAllowed: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hits Allowed</label>
                    <input
                      type="number"
                      value={gameForm.hitsAllowed}
                      onChange={(e) => setGameForm({ ...gameForm, hitsAllowed: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Runs Allowed</label>
                    <input
                      type="number"
                      value={gameForm.runsAllowed}
                      onChange={(e) => setGameForm({ ...gameForm, runsAllowed: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Earned Runs</label>
                    <input
                      type="number"
                      value={gameForm.earnedRuns}
                      onChange={(e) => setGameForm({ ...gameForm, earnedRuns: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">HRs Allowed</label>
                    <input
                      type="number"
                      value={gameForm.homeRunsAllowed}
                      onChange={(e) => setGameForm({ ...gameForm, homeRunsAllowed: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddGame}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 mt-6"
              >
                {loading ? 'Recording...' : 'Record Game Stats'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {!currentUser && renderLoginSignup()}
      {currentUser && currentView === 'dashboard' && renderDashboard()}
      {currentUser && currentView === 'createTeam' && renderCreateTeam()}
      {currentUser && currentView === 'createPlayer' && renderCreatePlayer()}
      {currentUser && currentView === 'addGame' && renderAddGame()}
    </div>
  );
};

export default BaseballStatsApp;