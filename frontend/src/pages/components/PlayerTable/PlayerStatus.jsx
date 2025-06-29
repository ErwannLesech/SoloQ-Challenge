import { Link } from 'react-router-dom';
import { Tooltip } from '@mui/material';

export default function PlayerStatus({ isInGame, lastOnline }) {
  const now = new Date();
  const lastOnlineTime = new Date(lastOnline);
  const minutesSinceOnline = Math.floor((now - lastOnlineTime) / (1000 * 60));
  const isOnline = minutesSinceOnline < 10;

  if (isInGame) {
    return (
      <Link to={`/live-games`} className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Tooltip title="Currently in game - Click to view details" arrow>
          <div className="relative">
            <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </Tooltip>
      </Link>
    );
  }

  if (isOnline) {
    return (
      <Tooltip title={`Online - Last seen in game ${minutesSinceOnline} min ago`} arrow>
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`Offline - Last seen in game ${minutesSinceOnline} min ago`} arrow>
      <div className="flex justify-center opacity-50">
        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
      </div>
    </Tooltip>
  );
}