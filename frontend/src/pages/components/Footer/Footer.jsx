export default function Footer({ darkMode }) {
  return (
    <footer className={`mt-auto border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'} transition-colors duration-500`}>
      <div className="w-full mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
              R
            </div>
            <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              R-One Development
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              © {new Date().getFullYear()} R-One. All rights reserved.
            </div>
            <div className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs`}>
              Made with ❤️ for the League of Legends community
            </div>
          </div>
        </div>
        
        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            League of Legends Challenge Tracker • Built with React & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}