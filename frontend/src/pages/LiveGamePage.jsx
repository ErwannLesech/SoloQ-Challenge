import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DarkModeToggle from './components/DarkModeToggle/DarkModeToggle';
import Header from './components/Header/Header';

export default function LiveGamesPage() {
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null && savedMode !== undefined && savedMode !== 'undefined') {
      return JSON.parse(savedMode);
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  
  const apiUrl = import.meta.env.VITE_BACKEND_API_URL;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setUpdateStatus('Updating live games data...');
        
        const updateResponse = await fetch(`${apiUrl}/api/insert_live_games`, {
          method: 'POST',
        });
        const updateData = await updateResponse.json();
        console.log("Live games updated:", updateData);
        setUpdateStatus('Live games updated, fetching data...');
        
        const gamesResponse = await fetch(`${apiUrl}/api/live_games`);
        const gamesData = await gamesResponse.json();
        
        setLiveGames(gamesData);
        setUpdateStatus('');
      } catch (err) {
        console.error("Error:", err);
        setUpdateStatus('Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    const intervalId = setInterval(fetchData, 120000); // Refresh every 2 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className={`${darkMode ? 'dark' : ''}`}>
        <div className={`w-screen min-h-screen ${darkMode ? 'bg-gray-900 text-blue-300' : 'bg-slate-200 text-slate-800'} transition-colors duration-500`}>
          <div className="w-full px-4 md:px-8 py-6 md:py-10 relative">
            <Header darkMode={darkMode} setDarkMode={handleDarkModeChange} />
            <div className="text-center py-8">
              <div>Loading live games...</div>
              {updateStatus && <div className="text-sm text-gray-500 dark:text-gray-400">{updateStatus}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (liveGames.length === 0) {
    return (
      <div className={`${darkMode ? 'dark' : ''}`}>
        <div className={`w-screen min-h-screen ${darkMode ? 'bg-gray-900 text-blue-300' : 'bg-slate-200 text-slate-800'} transition-colors duration-500`}>
          <div className="w-full px-4 md:px-8 py-6 md:py-10 relative">
            <Header darkMode={darkMode} setDarkMode={handleDarkModeChange} />
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">No live games currently</h2>
              <Link 
                to="/" 
                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline`}
              >
                Back to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className={`w-screen min-h-screen ${darkMode ? 'bg-gray-900 text-blue-300' : 'bg-slate-200 text-slate-800'} transition-colors duration-500`}>
        <div className="w-full px-4 md:px-8 py-6 md:py-10 relative">
          <Header darkMode={darkMode} setDarkMode={handleDarkModeChange} />
          
          <div className="flex flex-col items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Live Games</h1>
            {updateStatus && <div className="text-sm text-gray-500 dark:text-gray-400">{updateStatus}</div>}
          </div>
          
          <div className="flex flex-col items-center gap-6 w-full max-w-6xl mx-auto">
            {liveGames.map((game) => (
              <LiveGameCard key={game.game_id} game={game} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveGameCard({ game, darkMode }) {
  const [participantsWithRank, setParticipantsWithRank] = useState(game.participants);
  const [loadingRanks, setLoadingRanks] = useState(true);
  const apiUrl = import.meta.env.VITE_BACKEND_API_URL;

  useEffect(() => {
    const fetchRankInfo = async () => {
      try {
        setLoadingRanks(true);
        const puuids = game.participants.map(p => p.puuid).join(',');
        const response = await fetch(`${apiUrl}/api/summoner_rank_info?puuids=${puuids}`);
        const rankData = await response.json();
        
        // Merge rank info with participants
        const updatedParticipants = game.participants.map(participant => {
          const rankInfo = rankData.find(r => r.puuid === participant.puuid) || {};
          return {
            ...participant,
            ...rankInfo
          };
        });
        
        // Sort participants by role (TOP -> JUNGLE -> MIDDLE -> BOTTOM -> UTILITY)
        const roleOrder = { 'TOP': 1, 'JUNGLE': 2, 'MIDDLE': 3, 'BOTTOM': 4, 'UTILITY': 5 };
        updatedParticipants.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
        
        setParticipantsWithRank(updatedParticipants);
      } catch (err) {
        console.error('Error fetching rank info:', err);
        setParticipantsWithRank(game.participants);
      } finally {
        setLoadingRanks(false);
      }
    };

    fetchRankInfo();
  }, [game.participants]);

  const durationMinutes = Math.floor(game.game_duration / 60);
  const durationSeconds = Math.floor(game.game_duration % 60);
  
  const team1Participants = participantsWithRank.filter(p => p.team_id === 100);
  const team2Participants = participantsWithRank.filter(p => p.team_id === 200);
  
  return (
    <div className={`w-full rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{game.game_mode}</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {getQueueType(game.game_queue_config_id)}
            </p>
          </div>
          <span className="text-sm">
            {durationMinutes}m {durationSeconds}s
          </span>
        </div>
      </div>
      
      <div className="p-4">
        {loadingRanks ? (
          <div className="flex justify-center py-4">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 */}
            <div className="space-y-2">
              <h4 className={`font-medium text-center ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Team 1</h4>
              {team1Participants.map((participant) => (
                <ParticipantItem key={participant.puuid} participant={participant} game={game} darkMode={darkMode} />
              ))}
            </div>
            
            {/* Team 2 */}
            <div className="space-y-2">
              <h4 className={`font-medium text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Team 2</h4>
              {team2Participants.map((participant) => (
                <ParticipantItem key={participant.puuid} participant={participant} game={game} darkMode={darkMode} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantItem({ participant, game, darkMode }) {
  if (!participant || !game) {
    return null;
  }

  const summonerSpells = {
    1: "Cleanse",
    3: "Exhaust",
    4: "Flash",
    6: "Haste",
    7: "Heal",
    11: "Smite",
    12: "Teleport",
    13: "Clarity",
    14: "Dot",
    21: "Barrier",
    32: "Snowball"
  };

  // Extract primary rune from perks
  const primaryRune = participant.perks 
    ? getPrimaryRune(participant.perks) 
    : null;

  // Rank information
  const soloRank = participant.soloq_tier 
    ? `${formatTier(participant.soloq_tier)} ${participant.soloq_rank || ''}`.trim() 
    : 'Unranked';
  const flexRank = participant.flexq_tier 
    ? `${formatTier(participant.flexq_tier)} ${participant.flexq_rank || ''}`.trim() 
    : 'Unranked';
  const summonerLevel = participant.summoner_level || '?';

  // Win rates
  const soloWinRate = participant.soloq_wins && participant.soloq_losses
    ? Math.round((participant.soloq_wins / (participant.soloq_wins + participant.soloq_losses)) * 100)
    : null;
  const flexWinRate = participant.flexq_wins && participant.flexq_losses
    ? Math.round((participant.flexq_wins / (participant.flexq_wins + participant.flexq_losses)) * 100)
    : null;

  return (
    <div className={`flex items-center space-x-2 p-2 rounded hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}>
      {/* Champion icon with level */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img 
            src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.champion_id}.png`}
            alt={participant.champion_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/40';
            }}
          />
        </div>
      </div>
      
      {/* Summoner info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          {primaryRune && (
            <img 
              src={`https://ddragon.leagueoflegends.com/cdn/img/${primaryRune.icon}`}
              alt="Primary rune"
              className="w-4 h-4 rounded"
            />
          )}
          <div className="truncate">
            <div className="font-medium truncate">
              {game.player_ref === participant.puuid ? (
                <span className={darkMode ? "text-red-400" : "text-red-600"}>{participant.riot_id || participant.summoner_name}</span>
              ) : (
                participant.riot_id || participant.summoner_name
              )}
            </div>
          </div>
        </div>
        
        {/* Rank information */}
        <div className="flex flex-col text-xs mt-1">
          
          
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Solo:</span>
              <span className="ml-1">{soloRank}</span>
              {soloWinRate && (
                <span className={`ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({soloWinRate}%)
                </span>
              )}
            </div>
            
            <div className="flex items-center">
              <span className={`font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Flex:</span>
              <span className="ml-1">{flexRank}</span>
              {flexWinRate && (
                <span className={`ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({flexWinRate}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Summoner spells */}
      <div className="flex flex-col space-y-1">
        <div className={`w-6 h-6 rounded overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <img 
            src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/Summoner${summonerSpells[participant.summoner_spell1] || participant.summoner_spell1}.png`}
            alt="Summoner spell 1"
            className="w-full h-full object-cover"
          />
        </div>
        <div className={`w-6 h-6 rounded overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <img 
            src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/Summoner${summonerSpells[participant.summoner_spell2] || participant.summoner_spell2}.png`}
            alt="Summoner spell 2"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to get queue type name
function getQueueType(queueId) {
  const queueTypes = {
    420: "Ranked Solo/Duo",
    440: "Ranked Flex",
    400: "Normal Draft",
    430: "Normal Blind",
    450: "ARAM",
    700: "Clash",
    900: "URF",
    1020: "One for All"
  };
  return queueTypes[queueId] || `Queue ID: ${queueId}`;
}

// Helper function to extract primary rune from perks
function getPrimaryRune(perks) {
  try {
    const perksData = typeof perks === 'string' ? JSON.parse(perks) : perks;
    if (!perksData || !perksData.styles) return null;
    
    const primaryStyle = perksData.styles.find(style => style.description === "primaryStyle");
    if (!primaryStyle || !primaryStyle.selections || primaryStyle.selections.length === 0) return null;
    
    const primaryRuneId = primaryStyle.selections[0].perk;
    return {
      id: primaryRuneId,
      icon: `perk-images/Styles/${primaryStyle.style}/${primaryRuneId}/${primaryRuneId}.png`
    };
  } catch (e) {
    console.error("Error parsing perks:", e);
    return null;
  }
}

// Helper function to format tier names
function formatTier(tier) {
  if (!tier) return 'Unranked';
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}