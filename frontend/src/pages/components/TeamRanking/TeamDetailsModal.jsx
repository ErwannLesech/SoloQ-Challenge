import React from 'react';

export default function TeamDetailsModal({ 
  showTeamModal, 
  setShowTeamModal, 
  teamRanking, 
  players, 
  calculateEloPoints,
  darkMode,
  getTeamColor
}) {
  if (!showTeamModal) return null;

  // Group players by team
  const playersByTeam = players.reduce((acc, player) => {
    if (!acc[player.team]) {
      acc[player.team] = [];
    }
    acc[player.team].push(player);
    return acc;
  }, {});

  // Sort players within each team by their elo points
  Object.keys(playersByTeam).forEach(team => {
    playersByTeam[team].sort((a, b) => calculateEloPoints(b) - calculateEloPoints(a));
  });

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[90vw] max-h-[80vh] overflow-y-auto relative shadow-2xl">
        <button
          className="absolute top-3 right-3 text-red-500 hover:text-red-700"
          onClick={() => setShowTeamModal(false)}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-600 dark:text-yellow-300">
          Team Rankings - Player Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamRanking.map(({ team, total }) => (
            <div 
              key={team} 
              className={`p-4 rounded-lg shadow-md ${getTeamColor(team)}`}
            >
              <h3 className="text-xl font-bold mb-4 text-center capitalize">
                {team} Team - {total.toLocaleString()} LPs
              </h3>
              
              <div className="space-y-3">
                {playersByTeam[team]?.map((player, index) => (
                  <div 
                    key={player.puuid} 
                    className="flex justify-between items-center p-3 rounded-md bg-white/30 dark:bg-black/30"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold">{index + 1}.</span>
                      <div>
                        <p className="font-medium">{player.player_name}</p>
                        <p className="text-sm opacity-80">{player.summoner_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {player.tier} {player.rank} - {player.lp} LP
                      </p>
                      <p className="text-sm">
                        Score: {calculateEloPoints(player).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}