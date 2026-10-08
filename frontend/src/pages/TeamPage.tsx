import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTeam, type TeamDetail } from '../api/teams'
import { fetchPlayerStats, type StatsSummary } from '../api/players'
import type { Player } from '../api/players'
import SquadBarChart, { type SquadBarDatum } from '../charts/SquadBarChart'

export default function TeamPage() {
  const { id } = useParams<{ id: string }>()
  const teamId = Number(id)

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [statsMap, setStatsMap] = useState<Record<number, StatsSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamId) return
    async function load() {
      try {
        const teamData = await fetchTeam(teamId)
        setTeam(teamData)

        const statsResults = await Promise.all(
          teamData.players.map((p) =>
            fetchPlayerStats(p.id)
              .then((s) => (s.length > 0 ? { id: p.id, stats: s[0] } : null))
              .catch(() => null),
          ),
        )
        const map: Record<number, StatsSummary> = {}
        for (const r of statsResults) {
          if (r) map[r.id] = r.stats
        }
        setStatsMap(map)
      } catch {
        setError('Failed to load team data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [teamId])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  }
  if (error || !team) {
    return <div className="flex items-center justify-center h-64 text-red-500">{error ?? 'Team not found.'}</div>
  }

  // Sort players by goals desc for the chart
  const chartData: SquadBarDatum[] = [...team.players]
    .map((p) => ({
      name: p.name.split(' ').slice(-1)[0], // last name only
      goals: statsMap[p.id]?.goals ?? 0,
      assists: statsMap[p.id]?.assists ?? 0,
    }))
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))

  const positionOrder = ['GK', 'DEF', 'MID', 'FWD']
  const sortedPlayers = [...team.players].sort(
    (a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position),
  )

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{team.name}</h1>
        <p className="text-sm text-gray-500">{team.players.length} players</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Squad table */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Squad</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-center">Pos</th>
                <th className="px-4 py-2 text-center">G</th>
                <th className="px-4 py-2 text-center">A</th>
                <th className="px-4 py-2 text-center">Apps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedPlayers.map((p: Player) => {
                const s = statsMap[p.id]
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <Link
                        to={`/players/${p.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {p.name}
                      </Link>
                      <span className="ml-2 text-xs text-gray-400">{p.nationality}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                        {p.position}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center font-medium text-gray-900">
                      {s?.goals ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-center font-medium text-gray-900">
                      {s?.assists ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-500">
                      {s?.matches_played ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* Bar chart */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Goals &amp; Assists
          </h2>
          <p className="text-xs text-gray-400 mb-4">Top contributors this season</p>
          <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> Goals
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> Assists
            </span>
          </div>
          <SquadBarChart data={chartData} />
        </section>
      </div>
    </main>
  )
}
