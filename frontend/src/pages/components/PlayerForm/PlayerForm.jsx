export default function PlayerForm({ 
  showForm, 
  setShowForm, 
  formData, 
  handleChange, 
  handleSubmit, 
  isSubmitting, 
  darkMode 
}) {
  if (!showForm) return null;

  return (
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
  )
}