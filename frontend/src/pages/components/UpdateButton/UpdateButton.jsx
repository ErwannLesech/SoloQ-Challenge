export default function UpdateButton({ 
  handleUpdatePlayer, 
  isUpdating, 
  isUpdateTooRecent 
}) {
  return (
    <button
      onClick={handleUpdatePlayer}
      disabled={isUpdating || isUpdateTooRecent}
      className={`relative overflow-hidden px-5 py-3 rounded-lg shadow-md transition text-white 
                  ${(isUpdating || isUpdateTooRecent) ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
    >
      <span className={`${isUpdating ? 'opacity-50' : 'opacity-100'} transition`}>
        {isUpdating ? "Updating..." : isUpdateTooRecent ? "Wait 2 minutes to update" : "Update challenge data"}
      </span>

      {isUpdating && (
        <svg className="animate-spin h-5 w-5 ml-2 text-white inline-block" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
    </button>
  )
}