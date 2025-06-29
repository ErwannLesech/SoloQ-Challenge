export default function TeamRanking({ 
  teamRanking, 
  darkMode, 
  getTeamColor,
  setShowTeamModal
}) {
  return (
    <div
      onClick={() => setShowTeamModal(true)}
      className="p-4 md:p-6 rounded-lg shadow-lg relative w-full lg:w-1/3 cursor-pointer group"
      style={{ 
        boxShadow: '0 0 15px 5px rgba(255, 215, 100, 0.8)', 
        backgroundColor: darkMode ? '#111827' : '#fefce8',
        minWidth: '280px',
        maxWidth: '100%'
      }}
    >
      {/* Add a magnifying glass icon similar to RecentMatches */}
      <div className="absolute top-3 right-3 text-gray-500 group-hover:text-yellow-500 transition">
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

      <h2 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-300 text-center border-b border-yellow-400 pb-2">
        PODIUM DES TEAMS
      </h2>
      <ul className="flex flex-col gap-3 w-full">
        {teamRanking.map(({ team, total }, index) => (
          <li
            key={team}
            className={`px-4 py-2 rounded-lg font-semibold cursor-default select-none ${getTeamColor(team)} w-full`}
          >
            <span className="font-bold">{index + 1}</span> - <span className="capitalize">{team}</span> (<span>{total.toLocaleString()} LPs</span>)
          </li>
        ))}
      </ul>
    </div>
  )
}