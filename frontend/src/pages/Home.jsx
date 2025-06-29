import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'

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
  const [darkMode, setDarkMode] = useState(false)
  const navigate = useNavigate()
  const [recentMatches, setRecentMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullMatchPanel, setShowFullMatchPanel] = useState(false);
  const [fullMatchList, setFullMatchList] = useState([]);


  const fetchMatches = () => {
    fetch(`${apiUrl}/api/recent_matches`)
      .then(res => res.json())
      .then(data => setRecentMatches(data))
      .catch(err => console.error("Erreur fetch matchs:", err));
  };

  const fetchFullMatchList = () => {
    fetch(`${apiUrl}/api/recent_matches_extended`) // adapte selon ton API
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

  // Calculer un score numérique d'elo basé sur tier et rank
  const calculateEloPoints = (player) => {
    const tierValue = tierOrder[player.tier?.toUpperCase()] || 0
    const rankValue = rankOrder[player.rank?.toUpperCase()] || 0
    // Poids : tier + rank + LP
    return tierValue + rankValue + (player.lp || 0);
  }

  const fetchPlayers = () => {
    fetch(`${apiUrl}/api/players`)
      .then(res => res.json())
      .then(data => {
        setPlayers(data)

        // Find the least recent updated_at among players
        const updateTimestamps = data.map(p => new Date(p.updated_at));
        const latest = new Date(Math.min(...updateTimestamps));
        setLastUpdate(latest);
      })
      .catch(err => console.error("Erreur fetch:", err));
  }


  useEffect(() => {
    fetchPlayers()
  }, [])

  // Filtrer les joueurs selon le terme de recherche
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

  // Calcul total elo par équipe + tri décroissant
  const teamRanking = useMemo(() => {
    const totals = players.reduce((acc, player) => {
      const elo = calculateEloPoints(player)
      acc[player.team] = (acc[player.team] || 0) + elo
      return acc
    }, {})

    // On veut un tableau trié : [{team: 'blue', total: 123}, ...]
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

  // Formulaire, handlers etc. restent identiques
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
        <div className="w-full px-8 py-10 relative">

          {/* Bouton mode sombre */}
          <button
            onClick={() => setDarkMode(prev => !prev)}
            className="absolute top-6 right-6 bg-gray-200 dark:bg-gray-700 p-2 rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            aria-label="Toggle Dark Mode"
          >
            {darkMode
              ? <SunIcon className="h-6 w-6 text-yellow-400" />
              : <MoonIcon className="h-6 w-6 text-gray-800" />}
          </button>

          <h1 className="text-5xl font-extrabold text-center mb-12 text-red-700 dark:text-red-400">
            5 Stack SoloQ Challenge
          </h1>

          <div className="flex flex-col items-center mb-8">
          {/* Buttons row */}
          <div className="flex justify-center gap-6">
            <button
              onClick={handleUpdatePlayer}
              disabled={isUpdating || isUpdateTooRecent()}
              className={`relative overflow-hidden px-5 py-3 rounded-lg shadow-md transition text-white 
                          ${(isUpdating || isUpdateTooRecent()) ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <span className={`${isUpdating ? 'opacity-50' : 'opacity-100'} transition`}>
                {isUpdating ? "Updating..." : isUpdateTooRecent() ? "Wait 2 minutes to update" : "Update challenge data"}
              </span>

              {isUpdating && (
                <svg className="animate-spin h-5 w-5 ml-2 text-white inline-block" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setShowForm(prev => !prev)}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 shadow-md transition"
            >
              {showForm ? 'Cancel' : 'Add player to Challenge'}
            </button>
          </div>

          {/* Last updated text */}
          {lastUpdate && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </div>

          {/* Conteneur parent en flex */}
          <div className="flex justify-center gap-6 w-[80vw] max-w-full mx-auto mb-6">

            {/* Bloc classement des équipes */}
            <div
              className="p-6 rounded-lg shadow-lg relative w-1/3" 
              style={{ boxShadow: '0 0 15px 5px rgba(255, 215, 100, 0.8)', backgroundColor: darkMode ? '#111827' : '#fefce8' }}
            >
              <h2 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-300 text-center border-b border-yellow-400 pb-2">
                PODIUM DES TEAMS
              </h2>
              <ul className="flex flex-col gap-4">
                {teamRanking.map(({ team, total }, index) => (
                  <li
                    key={team}
                    className={`px-4 py-2 rounded-lg font-semibold cursor-default select-none ${getTeamColor(team)}`}
                    style={{ minWidth: 200 }}
                  >
                    <span className="font-bold">{index + 1}</span> - <span className="capitalize">{team}</span> (<span>{total.toLocaleString()} LPs</span>)
                  </li>
                ))}
              </ul>
            </div>

            {/* Bloc derniers matchs joués */}
            <div
              onClick={() => {
                setShowFullMatchPanel(true);
                fetchFullMatchList();
              }}
              className="p-6 rounded-lg shadow-lg w-2/3 cursor-pointer relative group"
              style={{
                boxShadow: '0 0 15px 5px rgba(150, 220, 255, 0.6)',
                backgroundColor: darkMode ? '#1e293b' : '#f0f9ff'
              }}
            >
              {/* Icône loupe en haut à droite */}
              <div className="absolute top-3 right-3 text-gray-500 group-hover:text-blue-500 transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </div>

              <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300 text-center border-b border-blue-400 pb-2">
                DERNIERS MATCHS DU CHALLENGE
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-800 dark:text-gray-200">
                  <thead className="bg-blue-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100">
                    <tr>
                      <th className="p-3 text-left">Joueur</th>
                      <th className="p-3 text-left">Équipe</th>
                      <th className="p-3 text-left">Champion</th>
                      <th className="p-3 text-left">Adversaire</th>
                      <th className="p-3 text-center">KDA</th>
                      <th className="p-3 text-center">Résultat</th>
                      <th className="p-3 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMatches.slice(0, 10).map((match, index) => (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-blue-50 dark:bg-slate-700'}`}>
                        <td className="p-3">{match.summoner_name}</td>
                        <td className="p-3 capitalize">{match.team}</td>
                        <td className="p-3">{match.champion_name}</td>
                        <td className="p-3">{match.opponent_champion}</td>
                        <td className="p-3 text-center">
                          <span className="font-semibold">
                            {match.kills}/{match.deaths}/{match.assists}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full font-semibold text-white ${match.win ? 'bg-green-500' : 'bg-red-500'}`}>
                            {match.win ? 'Win' : 'Loss'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {new Date(match.game_datetime).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {recentMatches.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-4">Aucun match trouvé</div>
              )}
            </div>
          </div>


          {/* Formulaire */}
          {showForm && (
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 mb-12 space-y-6 transition-colors duration-500">
              <div>
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Player Name</label>
                <input
                  type="text"
                  name="playerName"
                  value={formData.playerName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Summoner Name</label>
                <input
                  type="text"
                  name="summonerName"
                  value={formData.summonerName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Riot Tag</label>
                <input
                  type="text"
                  name="userTag"
                  value={formData.userTag}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Team</label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="blue">Blue</option>
                  <option value="orange">Orange</option>
                  <option value="red">Red</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Player"}
              </button>
            </form>
          )}

          {/* Tableau des joueurs */}
          <div className="overflow-x-auto w-[80vw] max-w-full mx-auto">
            {/* Barre de recherche */}
            <div className="mb-6 flex">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search players, summoner names, or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Compteur de résultats */}
            {searchTerm && (
              <div className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
                {filteredPlayers.length !== players.length && ` out of ${players.length}`}
              </div>
            )}

            <table className="min-w-full border-collapse text-sm text-gray-800 dark:text-gray-300 shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                <tr>
                  <th className="p-4 text-left font-semibold">#</th>
                  <th className="p-4 text-left font-semibold">Player Name</th>
                  <th className="p-4 text-left font-semibold">Summoner Name</th>
                  <th className="p-4 text-left font-semibold">Team</th>
                  <th className="p-4 text-center font-semibold">Elo</th>
                  <th className="p-4 text-center font-semibold">LP</th>
                  <th className="p-4 text-center font-semibold">Total Games</th>
                  <th className="p-4 text-center font-semibold">Wins</th>
                  <th className="p-4 text-center font-semibold">Losses</th>
                  <th className="p-4 text-center font-semibold">Winrate</th>
                  <th className="p-4 text-center font-semibold">Last Games (<span className={`w-3 h-3 rounded-full inline-block bg-green-500`} title="Win"></span>/<span className={`w-3 h-3 rounded-full inline-block bg-red-500`} title="Loss"></span>)</th>
                  <th className="p-4 text-center font-semibold">Stats</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map(player => (
                  <tr
                    key={player.puuid}
                    className={`${getTeamColor(player.team)} hover:opacity-90 cursor-pointer transition`}
                    onClick={() => window.open(player.opgg, '_blank', 'noopener,noreferrer')}
                  >
                    <td className="p-4 text-center">
                      <span className="font-semibold">{filteredPlayers.indexOf(player) + 1}</span>
                    </td>
                    <td className="p-4">{player.player_name}</td>
                    <td className="p-4">{player.summoner_name}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full font-medium ${getTeamColor(player.team)}`}>
                        {player.team.charAt(0).toUpperCase() + player.team.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-center">{player.tier} {player.rank}</td>
                    <td className="p-4 text-center">{player.lp}</td>
                    <td className="p-4 text-center">{player.total_games}</td>
                    <td className="p-4 text-center">{player.wins}</td>
                    <td className="p-4 text-center">{player.losses}</td>
                    <td className="p-4 text-center">{player.winrate}%</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        {(typeof player.last_games === 'string'
                          ? player.last_games.split(',').map(val => val === 'true')
                          : Array.isArray(player.last_games)
                            ? player.last_games
                            : []
                        ).map((game, index) => (
                          <span
                            key={index}
                            className={`w-3 h-3 rounded-full inline-block ${
                              game ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={`Game ${index + 1}: ${game ? 'Win' : 'Loss'}`}
                          ></span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <a
                        href={player.opgg}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        View Stats
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer */}
        <footer className={`mt-auto border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'} transition-colors duration-500`}>
          <div className="w-full mx-auto px-4 md:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
                  R
                </div>
                <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  R-One Development
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  © {new Date().getFullYear()} R-One. All rights reserved.
                </div>
                <div className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs`}>
                  Made with ❤️ for the League of Legends community
                </div>
              </div>
            </div>
            
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                League of Legends Challenge Tracker • Built with React & Tailwind CSS
              </p>
            </div>
          </div>
        </footer>

      </div>

      {/* Panel des 20 derniers matchs */}
      {showFullMatchPanel && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[90vw] max-h-[80vh] overflow-y-auto relative shadow-2xl">
            <button
              className="absolute top-3 right-3 text-red-500 hover:text-red-700"
              onClick={() => setShowFullMatchPanel(false)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-300">20 Derniers Matchs</h2>

            <table className="min-w-full text-sm text-gray-800 dark:text-gray-200">
              <thead className="bg-blue-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100">
                <tr>
                  <th className="p-3 text-left">Joueur</th>
                  <th className="p-3 text-left">Équipe</th>
                  <th className="p-3 text-left">Champion</th>
                  <th className="p-3 text-left">Adversaire</th>
                  <th className="p-3 text-center">KDA</th>
                  <th className="p-3 text-center">Résultat</th>
                  <th className="p-3 text-center">Date</th>
                </tr>
              </thead>
              <tbody>
                {fullMatchList.map((match, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-blue-50 dark:bg-slate-700'}`}>
                    <td className="p-3">{match.summoner_name}</td>
                    <td className="p-3 capitalize">{match.team}</td>
                    <td className="p-3">{match.champion_name}</td>
                    <td className="p-3">{match.opponent_champion}</td>
                    <td className="p-3 text-center font-semibold">
                      {match.kills}/{match.deaths}/{match.assists}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full font-semibold text-white ${match.win ? 'bg-green-500' : 'bg-red-500'}`}>
                        {match.win ? 'Win' : 'Loss'}
                      </span>
                    </td>
                    <td className="p-3 text-center">{new Date(match.game_datetime).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </div>
  )
}