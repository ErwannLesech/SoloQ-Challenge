import { useState } from 'react';
import PlayerRow from './PlayerRow';
import PlayerSearch from './PlayerSearch';

export default function PlayerTable({ 
  filteredPlayers: initialFilteredPlayers, 
  players, 
  searchTerm, 
  setSearchTerm, 
  getTeamColor, 
  darkMode 
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedPlayers = [...initialFilteredPlayers].sort((a, b) => {
    if (!sortConfig.key) return 0;

    // Special handling for different data types
    if (sortConfig.key === 'elo') {
      const aValue = parseInt(a.lp || 0) + (a.tier ? 1000 : 0); // Simplified example
      const bValue = parseInt(b.lp || 0) + (b.tier ? 1000 : 0);
      return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
    } else if (sortConfig.key === 'winrate') {
      const aValue = parseFloat(a.winrate || 0);
      const bValue = parseFloat(b.winrate || 0);
      return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
    } else if (sortConfig.key === 'total_games' || sortConfig.key === 'wins' || sortConfig.key === 'losses') {
      const aValue = parseInt(a[sortConfig.key] || 0);
      const bValue = parseInt(b[sortConfig.key] || 0);
      return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
    } else {
      // Default string comparison
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    }
  });

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d={sortConfig.direction === 'ascending' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
        />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto w-[80vw] max-w-full mx-auto">
      <PlayerSearch 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        darkMode={darkMode} 
      />
      
      {searchTerm && (
        <div className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''} found
          {sortedPlayers.length !== players.length && ` out of ${players.length}`}
        </div>
      )}

      <table className="min-w-full border-collapse text-sm text-gray-800 dark:text-gray-300 shadow-lg rounded-lg overflow-hidden">
        <thead className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
          <tr>
            <th className="p-4 text-left font-semibold">#</th>
            <th className="p-4 text-left font-semibold">Player Name</th>
            <th className="p-4 text-left font-semibold">Summoner Name</th>
            <th className="p-4 text-left font-semibold">Team</th>
            <th 
              className="p-4 text-center font-semibold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => requestSort('elo')}
            >
              <div className="flex items-center justify-center">
                Elo
                <SortIcon columnKey="elo" />
              </div>
            </th>
            <th className="p-4 text-center font-semibold">LP</th>
            <th 
              className="p-4 text-center font-semibold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => requestSort('total_games')}
            >
              <div className="flex items-center justify-center">
                Total Games
                <SortIcon columnKey="total_games" />
              </div>
            </th>
            <th 
              className="p-4 text-center font-semibold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => requestSort('wins')}
            >
              <div className="flex items-center justify-center">
                Wins
                <SortIcon columnKey="wins" />
              </div>
            </th>
            <th 
              className="p-4 text-center font-semibold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => requestSort('losses')}
            >
              <div className="flex items-center justify-center">
                Losses
                <SortIcon columnKey="losses" />
              </div>
            </th>
            <th 
              className="p-4 text-center font-semibold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => requestSort('winrate')}
            >
              <div className="flex items-center justify-center">
                Winrate
                <SortIcon columnKey="winrate" />
              </div>
            </th>
            <th className="p-4 text-center font-semibold">Last Games</th>
            <th className="p-4 text-center font-semibold">Stats</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <PlayerRow 
              key={player.puuid} 
              player={player} 
              index={index}
              getTeamColor={getTeamColor}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}