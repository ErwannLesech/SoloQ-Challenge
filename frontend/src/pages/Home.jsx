import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import DarkModeToggle from './components/DarkModeToggle/DarkModeToggle'
import Header from './components/Header/Header'
import TeamRanking from './components/TeamRanking/TeamRanking'
import RecentMatches from './components/RecentMatches/RecentMatches'
import MatchDetailsModal from './components/RecentMatches/MatchDetailsModal'
import PlayerForm from './components/PlayerForm/PlayerForm'
import PlayerTable from './components/PlayerTable/PlayerTable'
import Footer from './components/Footer/Footer'
import UpdateButton from './components/UpdateButton/UpdateButton'
import TeamDetailsModal from './components/TeamRanking/TeamDetailsModal'

export default function Home() {
  const apiUrl = import.meta.env.VITE_BACKEND_API_URL;
  
  const [players, setPlayers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    playerName: '',
    summonerName: '',
    userTag: '',
    team: 'blue'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const [recentMatches, setRecentMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullMatchPanel, setShowFullMatchPanel] = useState(false);
  const [fullMatchList, setFullMatchList] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    // Priorité au choix de l'utilisateur sauvegardé
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null && savedMode !== undefined && savedMode !== 'undefined') {
      return JSON.parse(savedMode);
    }
    // Sinon, utiliser la préférence système
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      // Ne changer que si l'utilisateur n'a pas modifié manuellement
      if (!localStorage.getItem('darkMode')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const handleDarkModeChange = (value) => {
    localStorage.setItem('darkMode', JSON.stringify(value));
    setDarkMode(value);
  };

  const fetchMatches = () => {
    fetch(`${apiUrl}/api/recent_matches`)
      .then(res => res.json())
      .then(data => setRecentMatches(data))
      .catch(err => console.error("Erreur fetch matchs:", err));
  };

  const fetchFullMatchList = () => {
    fetch(`${apiUrl}/api/recent_matches_extended`)
      .then(res => res.json())
      .then(data => setFullMatchList(data))
      .catch(err => console.error("Erreur fetch 20 derniers matchs:", err));
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  

  const tierOrder = {
    "IRON": 0,
    "BRONZE": 400,
    "SILVER": 800,
    "GOLD": 1200,
    "PLATINUM": 1600,
    "EMERALD": 2000,
    "DIAMOND": 2400,
    "MASTER": 2800,
    "GRANDMASTER": 3400,
    "CHALLENGER": 3800,
    "UNRANKED": 0
  };

  const rankOrder = {
    "IV": 0,
    "III": 100,
    "II": 200,
    "I": 300,
    "": 0
  };

  const calculateEloPoints = (player) => {
    const tierValue = tierOrder[player.tier?.toUpperCase()] || 0
    const rankValue = rankOrder[player.rank?.toUpperCase()] || 0
    return tierValue + rankValue + (player.lp || 0);
  }

  const fetchPlayers = () => {
    fetch(`${apiUrl}/api/players`)
      .then(res => res.json())
      .then(data => {
        setPlayers(data)
        const updateTimestamps = data.map(p => new Date(p.updated_at));
        const latest = new Date(Math.min(...updateTimestamps));
        setLastUpdate(latest);
      })
      .catch(err => console.error("Erreur fetch:", err));
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    
    return players.filter(player => 
      player.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.summoner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.team?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  const getTeamColor = (team) => {
    switch (team) {
      case "blue":
        return darkMode
          ? "bg-blue-900/60 text-blue-200 border border-blue-700/50"
          : "bg-blue-100 text-blue-800 border border-blue-200";
      case "orange":
        return darkMode
          ? "bg-orange-900/60 text-orange-200 border border-orange-700/50"
          : "bg-orange-100 text-orange-800 border border-orange-200";
      case "red":
        return darkMode
          ? "bg-red-900/60 text-red-200 border border-red-700/50"
          : "bg-red-100 text-red-800 border border-red-200";
      default:
        return darkMode
          ? "bg-gray-700 text-gray-200"
          : "bg-gray-200 text-gray-900";
    }
  };

  const teamRanking = useMemo(() => {
    const totals = players.reduce((acc, player) => {
      const elo = calculateEloPoints(player)
      acc[player.team] = (acc[player.team] || 0) + elo
      return acc
    }, {})

    return Object.entries(totals)
      .map(([team, total]) => ({ team, total }))
      .sort((a, b) => b.total - a.total)
  }, [players])

  const isUpdateTooRecent = () => {
    if (!lastUpdate) return false;
    const now = new Date();
    const diffInMs = now - new Date(lastUpdate);
    const diffInMinutes = diffInMs / 1000 / 60;
    return diffInMinutes < 2;
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(`${apiUrl}/api/player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Erreur lors de l'ajout du joueur.")

      fetchPlayers()
      setShowForm(false)
      setFormData({ playerName: '', summonerName: '', userTag: '', team: 'blue' })

    } catch (err) {
      alert("Erreur: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePlayer = () => {
    setIsUpdating(true)
    fetch(`${apiUrl}/api/update_players`)
      .then(res => res.json())
      .then(() => fetchPlayers())
      .then(() => fetchMatches()) 
      .catch(err => console.error("Erreur fetch:", err))
      .finally(() => setIsUpdating(false))
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className={`w-screen min-h-screen ${darkMode ? 'bg-gray-900 text-blue-300' : 'bg-slate-200 text-slate-800'} transition-colors duration-500`}>
        <div className="w-full px-4 md:px-8 py-6 md:py-10 relative">
          
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
          />
          <div className="flex flex-col items-center mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 w-full">
              <UpdateButton 
                handleUpdatePlayer={handleUpdatePlayer}
                isUpdating={isUpdating}
                isUpdateTooRecent={isUpdateTooRecent()}
              />

              <button
                onClick={() => setShowForm(prev => !prev)}
                className="bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-lg hover:bg-blue-700 shadow-md transition"
              >
                {showForm ? 'Cancel' : 'Add player to Challenge'}
              </button>

              <Link 
                to="/live-games" 
                className="bg-purple-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-lg hover:bg-purple-700 shadow-md transition text-center"
              >
                View Live Games
              </Link>
            </div>

            {lastUpdate && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 md:mt-4">
                Last updated: {lastUpdate.toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex flex-col lg:flex-row justify-center items-center gap-4 md:gap-6 w-[80vw] max-w-[80vw] mx-auto px-4 mb-6">
            <TeamRanking 
              teamRanking={teamRanking} 
              darkMode={darkMode} 
              getTeamColor={getTeamColor}
              setShowTeamModal={setShowTeamModal}
            />

            <RecentMatches 
              recentMatches={recentMatches} 
              darkMode={darkMode} 
              setShowFullMatchPanel={setShowFullMatchPanel}
              fetchFullMatchList={fetchFullMatchList}
            />
          </div>

          <PlayerForm 
            showForm={showForm}
            setShowForm={setShowForm}
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            darkMode={darkMode}
          />

          <PlayerTable 
            filteredPlayers={filteredPlayers}
            players={players}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            getTeamColor={getTeamColor}
            darkMode={darkMode}
          />
        </div>

        <Footer darkMode={darkMode} />
      </div>

      {/* Les modales restent inchangées */}
      {showTeamModal && (
        <TeamDetailsModal 
          showTeamModal={showTeamModal}
          setShowTeamModal={setShowTeamModal}
          teamRanking={teamRanking}
          players={players}
          calculateEloPoints={calculateEloPoints}
          darkMode={darkMode}
          getTeamColor={getTeamColor}
        />
      )}

      {showFullMatchPanel && (
        <MatchDetailsModal 
          showFullMatchPanel={showFullMatchPanel}
          setShowFullMatchPanel={setShowFullMatchPanel}
          fullMatchList={fullMatchList}
        />
      )}
    </div>
  )
}