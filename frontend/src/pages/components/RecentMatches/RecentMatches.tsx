export default function RecentMatches({ recentMatches, darkMode, setShowFullMatchPanel, fetchFullMatchList }) {
  return (
    <div
      onClick={() => {
        setShowFullMatchPanel(true);
        fetchFullMatchList();
      }}
      className="p-6 rounded-lg shadow-lg cursor-pointer w-full relative group"
      style={{
        boxShadow: '0 0 15px 5px rgba(150, 220, 255, 0.6)',
        backgroundColor: darkMode ? '#1e293b' : '#f0f9ff',
        minWidth: '280px',
        maxWidth: '100%'
      }}
    >
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
  )
}