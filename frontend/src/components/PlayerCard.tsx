import { Link } from 'react-router-dom'
import type { Player } from '../api/players'
import type { StatsSummary } from '../api/players'

interface PlayerCardProps {
  player: Player
  stats?: StatsSummary
  teamName?: string
}

export default function PlayerCard({ player, stats, teamName }: PlayerCardProps) {
  return (
    <Link
      to={`/players/${player.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{player.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {player.position}
            {teamName ? ` · ${teamName}` : ''}
          </p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-medium">
          {player.nationality}
        </span>
      </div>
      {stats && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{stats.goals}</p>
            <p className="text-xs text-gray-500">Goals</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{stats.assists}</p>
            <p className="text-xs text-gray-500">Assists</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{stats.matches_played}</p>
            <p className="text-xs text-gray-500">Apps</p>
          </div>
        </div>
      )}
    </Link>
  )
}
