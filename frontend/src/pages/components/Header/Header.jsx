import RankIcon from '../RankIcon/RankIcon';
import SiteIcon from '/public/icons/5stackIcon.png';
import DarkModeToggle from '../DarkModeToggle/DarkModeToggle';
import { Link } from 'react-router-dom';

export default function Header({ darkMode, setDarkMode }) {
  return (
    <div className="text-center mb-12 relative">
      <div className="flex justify-between items-start absolute w-full top-0 left-0 px-4 py-4 z-20">
        {/* Icône de site */}
        <div className="w-12 h-12 flex items-center justify-center">
          <Link to="/">
            <img 
              src={SiteIcon}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 
                      border-purple-500 hover:scale-110 transition-all"
              alt="Logo"
            />
          </Link>
        </div>
        
        {/* Bouton dark mode */}
        <div className="w-12 h-12 flex items-center justify-center">
            <DarkModeToggle 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            className="hover:scale-110 transition-transform"
            />
        </div>
      </div>

      {/* Flou adapté au thème */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className={`absolute inset-0 bg-gradient-to-r blur-lg opacity-20 transition duration-500
                        ${darkMode 
                          ? 'from-red-600 to-purple-600 opacity-30' 
                          : 'from-red-400 to-purple-400 opacity-15'}`}
             style={{
               left: '-10%',
               right: '-10%',
               width: '120%'
             }}></div>
      </div>
      
      {/* Texte adapté au thème */}
      <div className="relative">
        <h1 className={`text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br text-transparent bg-clip-text
                       ${darkMode 
                         ? 'from-red-700 to-purple-800' 
                         : 'from-red-600 to-purple-700'}`}>
          5 STACK SOLOQ CHALLENGE
        </h1>
        
        {/* Icônes avec opacité adaptée */}
        <div className="flex justify-center items-center mt-4 space-x-4">
          {['CHALLENGER', 'GRANDMASTER', 'MASTER', 'DIAMOND'].map((tier) => (
            <div key={tier} className={`p-1 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <RankIcon 
                tier={tier} 
                className="w-8 h-8 hover:scale-110 transition-transform"
              />
            </div>
          ))}
        </div>
      </div>
      
      <p className={`mt-4 text-lg font-medium ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
        Track your team's ranked progress
      </p>
    </div>
  );
}