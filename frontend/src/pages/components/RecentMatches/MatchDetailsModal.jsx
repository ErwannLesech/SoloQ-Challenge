export default function MatchDetailsModal({ showFullMatchPanel, setShowFullMatchPanel, fullMatchList }) {
  return (
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
  )
}