export default function PlayerSearch({ searchTerm, setSearchTerm, darkMode, setTeamFilter }) {
  return (
    <div className="mb-6 w-full">
      <div className="flex flex-col md:flex-row gap-3 w-full">
        {/* Search Bar - now takes appropriate space */}
        <div className="relative flex-grow">
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

        {/* Team Filter Buttons - now more prominent */}
        <div className="flex flex-1 gap-2">
          <button
            onClick={() => setTeamFilter('all')}
            className={`flex-1 px-4 py-3 rounded-lg shadow-md transition-all font-medium
              ${darkMode ? 
                'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' : 
                'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'}
              hover:scale-[1.02] active:scale-[0.98]`}
          >
            Global
          </button>
          <button
            onClick={() => setTeamFilter('blue')}
            className={`flex-1 px-4 py-3 rounded-lg shadow-md transition-all font-medium
              ${darkMode ? 
                'bg-blue-900/80 hover:bg-blue-800/80 text-blue-200 border border-blue-700' : 
                'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200'}
              hover:scale-[1.02] active:scale-[0.98]`}
          >
            Team Blue
          </button>
          <button
            onClick={() => setTeamFilter('orange')}
            className={`flex-1 px-4 py-3 rounded-lg shadow-md transition-all font-medium
              ${darkMode ? 
                'bg-orange-900/80 hover:bg-orange-800/80 text-orange-200 border border-orange-700' : 
                'bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-200'}
              hover:scale-[1.02] active:scale-[0.98]`}
          >
            Team Orange
          </button>
          <button
            onClick={() => setTeamFilter('red')}
            className={`flex-1 px-4 py-3 rounded-lg shadow-md transition-all font-medium
              ${darkMode ? 
                'bg-red-900/80 hover:bg-red-800/80 text-red-200 border border-red-700' : 
                'bg-red-100 hover:bg-red-200 text-red-800 border border-red-200'}
              hover:scale-[1.02] active:scale-[0.98]`}
          >
            Team Red
          </button>
        </div>
      </div>
    </div>
  )
}