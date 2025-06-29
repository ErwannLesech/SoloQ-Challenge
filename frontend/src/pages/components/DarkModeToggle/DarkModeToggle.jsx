import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'

export default function DarkModeToggle({ darkMode, setDarkMode, className = "" }) {
  return (
    <button
      onClick={() => setDarkMode(prev => !prev)}
      className={`p-2 rounded-full shadow-md transition ${className} ${
        darkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      }`}
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <SunIcon className="h-6 w-6" />
      ) : (
        <MoonIcon className="h-6 w-6" />
      )}
    </button>
  );
}