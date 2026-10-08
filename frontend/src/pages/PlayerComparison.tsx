import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  fetchPlayers,
  type Player,
  type StatsSummary,
} from '../api/players'
import { fetchCompare, type CompareEntry } from '../api/compare'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

// ── Radar helpers (mirrors RadarChart.tsx normalisation) ─────────────────────

const CEILINGS: Record<string, number> = {
  Goals: 30,
  Assists: 20,
  'Pass Acc.': 100,
  'Shots OT': 60,
  'Dist. (km)': 400,
  Matches: 38,
}

function normalise(value: number, ceiling: number) {
  return Math.min(100, Math.round((value / ceiling) * 100))
}

function buildRadarData(stats: StatsSummary) {
  return {
    Goals:       normalise(stats.goals,           CEILINGS['Goals']),
    Assists:     normalise(stats.assists,          CEILINGS['Assists']),
    'Pass Acc.': normalise(stats.pass_accuracy,   CEILINGS['Pass Acc.']),
    'Shots OT':  normalise(stats.shots_on_target, CEILINGS['Shots OT']),
    'Dist. (km)':normalise(stats.distance_covered,CEILINGS['Dist. (km)']),
    Matches:     normalise(stats.matches_played,  CEILINGS['Matches']),
  }
}

const ATTRIBUTES = ['Goals', 'Assists', 'Pass Acc.', 'Shots OT', 'Dist. (km)', 'Matches'] as const

const COLORS = ['#3b82f6', '#f97316'] as const  // blue, orange

// ── sub-components ───────────────────────────────────────────────────────────

function PlayerSelector({
  label,
  players,
  selectedId,
  excludeId,
  onChange,
}: {
  label: string
  players: Player[]
  selectedId: number | null
  excludeId: number | null
  onChange: (id: number) => void
}) {
  const available = players.filter((p) => p.id !== excludeId)
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <select
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={selectedId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="" disabled>
          Select a player…
        </option>
        {available.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.position})
          </option>
        ))}
      </select>
    </div>
  )
}

interface OverlayRadarProps {
  statsA: StatsSummary
  statsB: StatsSummary
  nameA: string
  nameB: string
}

function OverlayRadar({ statsA, statsB, nameA, nameB }: OverlayRadarProps) {
  const dataA = buildRadarData(statsA)
  const dataB = buildRadarData(statsB)

  const chartData = ATTRIBUTES.map((attr) => ({
    attribute: attr,
    [nameA]: dataA[attr],
    [nameB]: dataB[attr],
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsRadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Radar
          name={nameA}
          dataKey={nameA}
          stroke={COLORS[0]}
          fill={COLORS[0]}
          fillOpacity={0.2}
          dot={{ r: 3, fill: COLORS[0] }}
        />
        <Radar
          name={nameB}
          dataKey={nameB}
          stroke={COLORS[1]}
          fill={COLORS[1]}
          fillOpacity={0.2}
          dot={{ r: 3, fill: COLORS[1] }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip
          formatter={(v: number) => [`${v} / 100`, '']}
          contentStyle={{ fontSize: 12 }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}

interface StatDiffTableProps {
  statsA: StatsSummary
  statsB: StatsSummary
  nameA: string
  nameB: string
}

function StatDiffTable({ statsA, statsB, nameA, nameB }: StatDiffTableProps) {
  const rows = [
    { label: 'Goals',           a: statsA.goals,           b: statsB.goals },
    { label: 'Assists',         a: statsA.assists,          b: statsB.assists },
    { label: 'Shots',           a: statsA.shots,            b: statsB.shots },
    { label: 'Shots on Target', a: statsA.shots_on_target,  b: statsB.shots_on_target },
    { label: 'Passes',          a: statsA.passes,           b: statsB.passes },
    {
      label: 'Pass Accuracy',
      a: `${statsA.pass_accuracy.toFixed(1)}%`,
      b: `${statsB.pass_accuracy.toFixed(1)}%`,
      numA: statsA.pass_accuracy,
      numB: statsB.pass_accuracy,
    },
    {
      label: 'Distance (km)',
      a: statsA.distance_covered.toFixed(0),
      b: statsB.distance_covered.toFixed(0),
      numA: statsA.distance_covered,
      numB: statsB.distance_covered,
    },
    { label: 'Matches Played',  a: statsA.matches_played,   b: statsB.matches_played },
    { label: 'Minutes Played',  a: statsA.minutes_played,   b: statsB.minutes_played },
  ]

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
          <th className="px-4 py-2 text-right w-1/3" style={{ color: COLORS[0] }}>{nameA}</th>
          <th className="px-4 py-2 text-center w-1/3">Stat</th>
          <th className="px-4 py-2 text-left w-1/3" style={{ color: COLORS[1] }}>{nameB}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((row) => {
          const numA = typeof row.a === 'number' ? row.a : (row as { numA?: number }).numA ?? 0
          const numB = typeof row.b === 'number' ? row.b : (row as { numB?: number }).numB ?? 0
          const aWins = numA > numB
          const bWins = numB > numA
          return (
            <tr key={row.label}>
              <td
                className={`px-4 py-2 text-right font-semibold ${
                  aWins ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {row.a}
              </td>
              <td className="px-4 py-2 text-center text-gray-400">{row.label}</td>
              <td
                className={`px-4 py-2 text-left font-semibold ${
                  bWins ? 'text-orange-500' : 'text-gray-900'
                }`}
              >
                {row.b}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function PlayerComparison() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [playerIdA, setPlayerIdA] = useState<number | null>(
    () => {
      const raw = searchParams.get('ids')
      return raw ? Number(raw.split(',')[0]) || null : null
    },
  )
  const [playerIdB, setPlayerIdB] = useState<number | null>(null)

  const [statsA, setStatsA] = useState<StatsSummary | null>(null)
  const [statsB, setStatsB] = useState<StatsSummary | null>(null)
  const [nameA, setNameA] = useState<string>('')
  const [nameB, setNameB] = useState<string>('')

  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load player list once
  useEffect(() => {
    fetchPlayers()
      .then(setAllPlayers)
      .catch(() => setError('Failed to load players.'))
      .finally(() => setLoadingPlayers(false))
  }, [])

  // Trigger comparison when both IDs are selected
  useEffect(() => {
    if (!playerIdA || !playerIdB) return
    setLoadingCompare(true)
    setError(null)
    fetchCompare([playerIdA, playerIdB])
      .then((payload) => {
        const entryA = payload.players.find((e: CompareEntry) => e.player.id === playerIdA)
        const entryB = payload.players.find((e: CompareEntry) => e.player.id === playerIdB)
        if (entryA?.stats) { setNameA(entryA.player.name); setStatsA(entryA.stats) }
        if (entryB?.stats) { setNameB(entryB.player.name); setStatsB(entryB.stats) }
      })
      .catch(() => setError('Failed to load comparison data.'))
      .finally(() => setLoadingCompare(false))
  }, [playerIdA, playerIdB])

  // Keep URL in sync
  function handleSelectA(id: number) {
    setPlayerIdA(id)
    setStatsA(null)
    if (playerIdB) setSearchParams({ ids: `${id},${playerIdB}` })
  }

  function handleSelectB(id: number) {
    setPlayerIdB(id)
    setStatsB(null)
    if (playerIdA) setSearchParams({ ids: `${playerIdA},${id}` })
  }

  const hasComparison = statsA && statsB

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Player Comparison</h1>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {loadingPlayers ? (
          <p className="text-sm text-gray-400 col-span-2">Loading players…</p>
        ) : (
          <>
            <PlayerSelector
              label="Player A"
              players={allPlayers}
              selectedId={playerIdA}
              excludeId={playerIdB}
              onChange={handleSelectA}
            />
            <PlayerSelector
              label="Player B"
              players={allPlayers}
              selectedId={playerIdB}
              excludeId={playerIdA}
              onChange={handleSelectB}
            />
          </>
        )}
      </div>

      {/* Waiting state */}
      {!playerIdA || !playerIdB ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
          Select two players above to compare them.
        </div>
      ) : loadingCompare ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
      ) : hasComparison ? (
        <>
          {/* Player name header */}
          <div className="grid grid-cols-2 mb-4">
            <div className="text-center">
              <Link
                to={`/players/${playerIdA}`}
                className="text-base font-bold hover:underline"
                style={{ color: COLORS[0] }}
              >
                {nameA}
              </Link>
            </div>
            <div className="text-center">
              <Link
                to={`/players/${playerIdB}`}
                className="text-base font-bold hover:underline"
                style={{ color: COLORS[1] }}
              >
                {nameB}
              </Link>
            </div>
          </div>

          {/* Radar overlay */}
          <section className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Attribute Radar
            </h2>
            <OverlayRadar statsA={statsA} statsB={statsB} nameA={nameA} nameB={nameB} />
          </section>

          {/* Stat diff table */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Season Stats
              </h2>
            </div>
            <StatDiffTable statsA={statsA} statsB={statsB} nameA={nameA} nameB={nameB} />
          </section>
        </>
      ) : null}
    </main>
  )
}
