import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPlayers, type Player, type StatsSummary } from '../api/players'
import { fetchTeams, type Team } from '../api/teams'
import { fetchMatches, type Match } from '../api/matches'
import { fetchPlayerStats } from '../api/players'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wide mb-3">
      {children}
    </h2>
  )
}

interface LeaderRowProps {
  rank: number
  player: Player
  value: number
  label: string
  teamName: string
}
function LeaderRow({ rank, player, value, label, teamName }: LeaderRowProps) {
  return (
    <Link
      to={`/players/${player.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <span className="w-6 text-center text-sm font-bold text-gray-400">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{player.name}</p>
        <p className="text-xs text-gray-500 truncate">{player.position} · {teamName}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-blue-600">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </Link>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

interface PlayerWithStats {
  player: Player
  stats: StatsSummary
}

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerWithStats[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [teamsData, playersData, matchesData] = await Promise.all([
          fetchTeams(),
          fetchPlayers(),
          fetchMatches(),
        ])
        setTeams(teamsData)
        setMatches(matchesData)

        // Fetch stats for all players in parallel (batch)
        const statsResults = await Promise.all(
          playersData.map((p) =>
            fetchPlayerStats(p.id)
              .then((s) => (s.length > 0 ? { player: p, stats: s[0] } : null))
              .catch(() => null),
          ),
        )
        setPlayerStats(statsResults.filter((x): x is PlayerWithStats => x !== null))
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  const topScorers = [...playerStats]
    .sort((a, b) => b.stats.goals - a.stats.goals)
    .slice(0, 10)

  const topAssisters = [...playerStats]
    .sort((a, b) => b.stats.assists - a.stats.assists)
    .slice(0, 10)

  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Scorers */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <SectionHeader>🥅 Top Scorers</SectionHeader>
          </div>
          <div className="divide-y divide-gray-100">
            {topScorers.map(({ player, stats }, i) => (
              <LeaderRow
                key={player.id}
                rank={i + 1}
                player={player}
                value={stats.goals}
                label="goals"
                teamName={teamMap[player.team_id]?.short_name ?? '—'}
              />
            ))}
          </div>
        </section>

        {/* Top Assisters */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <SectionHeader>🎯 Top Assisters</SectionHeader>
          </div>
          <div className="divide-y divide-gray-100">
            {topAssisters.map(({ player, stats }, i) => (
              <LeaderRow
                key={player.id}
                rank={i + 1}
                player={player}
                value={stats.assists}
                label="assists"
                teamName={teamMap[player.team_id]?.short_name ?? '—'}
              />
            ))}
          </div>
        </section>

        {/* Recent Matches */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <SectionHeader>📅 Recent Matches</SectionHeader>
          </div>
          <div className="divide-y divide-gray-100">
            {recentMatches.map((m) => {
              const home = teamMap[m.home_team_id]
              const away = teamMap[m.away_team_id]
              return (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 text-right pr-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {home?.short_name ?? '?'}
                    </p>
                  </div>
                  <div className="text-center px-2 shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {m.home_score} – {m.away_score}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(m.date)}</p>
                  </div>
                  <div className="flex-1 min-w-0 text-left pl-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {away?.short_name ?? '?'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Teams quick-nav */}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Teams</p>
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => (
                <Link
                  key={t.id}
                  to={`/teams/${t.id}`}
                  className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-full px-3 py-1 transition-colors"
                >
                  {t.short_name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
