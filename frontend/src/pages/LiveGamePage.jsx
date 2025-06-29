import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function LiveGamesPage() {
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState('');
  
  const apiUrl = import.meta.env.VITE_BACKEND_API_URL;

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
    
    // Optionnel: Mettre en place un intervalle pour rafraîchir les données
    const intervalId = setInterval(fetchData, 120000); // Rafraîchir toutes les 2 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div>Loading live games...</div>
        {updateStatus && <div className="text-sm text-gray-500">{updateStatus}</div>}
      </div>
    );
  }

  if (liveGames.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No live games currently</h2>
        <Link to="/" className="text-blue-500 hover:underline">
          Back to Home Page
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Live Games</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveGames.map((game) => (
          <LiveGameCard key={game.game_id} game={game} />
        ))}
      </div>
    </div>
  );
}

function LiveGameCard({ game }) {
  const durationMinutes = Math.floor(game.game_duration / 60);
  const durationSeconds = game.game_duration % 60;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-100 dark:bg-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{game.game_mode}</h3>
          <span className="text-sm">
            {durationMinutes}m {durationSeconds}s
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <TeamStats team={game.teams.team1} teamId={100} />
          <div className="text-center px-4">
            <div className="text-xl font-bold">VS</div>
            <div className="text-sm text-gray-500">Gold diff: {Math.abs(game.teams.team1.gold - game.teams.team2.gold)}</div>
          </div>
          <TeamStats team={game.teams.team2} teamId={200} />
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Participants:</h4>
          <div className="grid grid-cols-2 gap-2">
            {game.participants.map((participant) => (
              <ParticipantItem key={participant.puuid} participant={participant} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamStats({ team, teamId }) {
  return (
    <div className={`border-2 ${teamId === 100 ? 'border-blue-500' : 'border-red-500'} rounded-lg p-2`}>
      <div className="text-center font-medium mb-1">Team {teamId === 100 ? 'Blue' : 'Red'}</div>
      <div className="text-sm">
        <div>Towers: {team.objectives.towers}</div>
        <div>Dragons: {team.objectives.dragons}</div>
        <div>Barons: {team.objectives.barons}</div>
        <div>Gold: {team.gold.toLocaleString()}</div>
      </div>
    </div>
  );
}

function ParticipantItem({ participant }) {
  return (
    <div className="flex items-center space-x-2 p-1 bg-gray-50 dark:bg-gray-700 rounded">
      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0">
        {/* Vous pourriez ajouter une image de champion ici */}
      </div>
      <div className="truncate">
        <div className="font-medium truncate">{participant.summoner_name}</div>
        <div className="text-xs text-gray-500 truncate">{participant.champion_name}</div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-sm">
          {participant.kills}/{participant.deaths}/{participant.assists}
        </div>
        <div className="text-xs">{participant.gold.toLocaleString()}g</div>
      </div>
    </div>
  );
}