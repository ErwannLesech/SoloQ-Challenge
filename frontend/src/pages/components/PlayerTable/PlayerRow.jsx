import RankIcon from "../RankIcon/RankIcon"
import PlayerStatus from './PlayerStatus';

export default function PlayerRow({ player, index, getTeamColor, isInGame, lastOnline }) {
  return (
    <tr
      className={`${getTeamColor(player.team)} hover:opacity-90 cursor-pointer transition`}
      onClick={() => window.open(player.opgg, '_blank', 'noopener,noreferrer')}
    >
      <td className="p-4 text-center">
        <span className="font-semibold">{index + 1}</span>
      </td>
      <td className="p-4 text-center">
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/14.13.1/img/profileicon/${player.profileiconid}.png`}
          alt={`${player.player_name}'s profile icon`}
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            e.target.src = 'https://ddragon.leagueoflegends.com/cdn/13.20.1/img/profileicon/0.png'; // Default icon
            e.target.alt = 'Default profile icon';
          }}
        />
      </td>
      <td className="p-4">{player.player_name}</td>
      <td className="p-4">{player.summoner_name}</td>
      <td className="p-4 text-center">
        <span className="text-gray-500 dark:text-gray-400">
          {player.summoner_level}
        </span>
      </td>
      <td className="p-4">
        <span className={`inline-block px-3 py-1 rounded-full font-medium ${getTeamColor(player.team)}`}>
          {player.team.charAt(0).toUpperCase() + player.team.slice(1)}
        </span>
      </td>
      <td className="p-4 text-center">
        <PlayerStatus 
          isInGame={isInGame} 
          lastOnline={lastOnline} 
        />
      </td>
      <td className="p-4 text-center flex items-center justify-center space-x-1">
        <RankIcon tier={player.tier} />
        <span>{player.tier} {player.rank}</span>
      </td>
      <td className="p-4 text-center">{player.lp}</td>
      <td className="p-4 text-center">{player.total_games}</td>
      <td className="p-4 text-center">{player.wins}</td>
      <td className="p-4 text-center">{player.losses}</td>
      <td className="p-4 text-center">{player.winrate}%</td>
      <td className="p-4 text-center">
        <div className="flex justify-center gap-1">
          {(typeof player.last_games === 'string'
            ? player.last_games.split(',').map(val => val === 'true')
            : Array.isArray(player.last_games)
              ? player.last_games
              : []
          ).map((game, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full inline-block ${
                game ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={`Game ${i + 1}: ${game ? 'Win' : 'Loss'}`}
            ></span>
          ))}
        </div>
      </td>
      <td className="p-4 text-center">
        <a
          href={player.opgg}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
          onClick={e => e.stopPropagation()}
        >
          View Stats
        </a>
      </td>
    </tr>
  )
}