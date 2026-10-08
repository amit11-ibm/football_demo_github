import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchMatch,
  fetchMatchEvents,
  type MatchDetail,
  type MatchEvent,
  type PassPoint,
} from '../api/matches'
import PassMap from '../components/pitch/PassMap'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const EVENT_ICON: Record<string, string> = {
  goal:    '⚽',
  shot:    '🎯',
  pass:    '↗️',
  touch:   '👟',
  tackle:  '🛡️',
  dribble: '💨',
}

// ── sub-components ───────────────────────────────────────────────────────────

function ScoreHeader({ match }: { match: MatchDetail }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <p className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wide">
        {formatDate(match.date)}
      </p>
      <div className="flex items-center justify-center gap-6">
        <div className="flex-1 text-right">
          <p className="text-xl font-bold text-gray-900">{match.home_team.name}</p>
          <p className="text-xs text-gray-400 mt-1">{match.home_team.short_name}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-4xl font-extrabold text-gray-900 tabular-nums">
            {match.home_score} – {match.away_score}
          </p>
        </div>
        <div className="flex-1 text-left">
          <p className="text-xl font-bold text-gray-900">{match.away_team.name}</p>
          <p className="text-xs text-gray-400 mt-1">{match.away_team.short_name}</p>
        </div>
      </div>
    </div>
  )
}

function LineupsTable({ match }: { match: MatchDetail }) {
  const homePlayers = match.lineups
    .filter((l) => l.team_id === match.home_team_id)
    .sort((a, b) => (b.starting_xi ? 1 : 0) - (a.starting_xi ? 1 : 0))

  const awayPlayers = match.lineups
    .filter((l) => l.team_id === match.away_team_id)
    .sort((a, b) => (b.starting_xi ? 1 : 0) - (a.starting_xi ? 1 : 0))

  const maxRows = Math.max(homePlayers.length, awayPlayers.length)

  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Lineups</h2>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Home */}
        <div>
          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {match.home_team.short_name}
          </div>
          <div className="divide-y divide-gray-50">
            {homePlayers.map((l) => (
              <Link
                key={l.id}
                to={`/players/${l.player_id}`}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                {l.starting_xi && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}
                {!l.starting_xi && (
                  <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                )}
                <span className="text-sm text-gray-800 truncate">{l.player.name}</span>
                <span className="text-xs text-gray-400 ml-auto shrink-0">{l.player.position}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* Away */}
        <div>
          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {match.away_team.short_name}
          </div>
          <div className="divide-y divide-gray-50">
            {awayPlayers.slice(0, maxRows).map((l) => (
              <Link
                key={l.id}
                to={`/players/${l.player_id}`}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                {l.starting_xi && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}
                {!l.starting_xi && (
                  <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                )}
                <span className="text-sm text-gray-800 truncate">{l.player.name}</span>
                <span className="text-xs text-gray-400 ml-auto shrink-0">{l.player.position}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-gray-100">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Starting XI
          <span className="w-2 h-2 rounded-full bg-gray-300 inline-block ml-2" />Sub
        </span>
      </div>
    </section>
  )
}

interface TeamStats {
  shots: number
  shotsOnTarget: number
  passes: number
  passesComplete: number
  tackles: number
}

function computeTeamStats(events: MatchEvent[], teamPlayerIds: Set<number>): TeamStats {
  const mine = events.filter((e) => teamPlayerIds.has(e.player_id))
  const shots = mine.filter((e) => e.type === 'shot').length
  const shotsOnTarget = mine.filter(
    (e) => e.type === 'shot' && (e.outcome === 'goal' || e.outcome === 'saved'),
  ).length
  const passes = mine.filter((e) => e.type === 'pass').length
  const passesComplete = mine.filter(
    (e) => e.type === 'pass' && e.outcome === 'complete',
  ).length
  const tackles = mine.filter((e) => e.type === 'tackle').length
  return { shots, shotsOnTarget, passes, passesComplete, tackles }
}

function TeamStatsTable({
  homeStats,
  awayStats,
  homeShort,
  awayShort,
}: {
  homeStats: TeamStats
  awayStats: TeamStats
  homeShort: string
  awayShort: string
}) {
  const rows = [
    {
      label: 'Shots',
      home: homeStats.shots,
      away: awayStats.shots,
    },
    {
      label: 'Shots on Target',
      home: homeStats.shotsOnTarget,
      away: awayStats.shotsOnTarget,
    },
    {
      label: 'Passes',
      home: homeStats.passes,
      away: awayStats.passes,
    },
    {
      label: 'Pass Accuracy',
      home: homeStats.passes > 0
        ? `${Math.round((homeStats.passesComplete / homeStats.passes) * 100)}%`
        : '—',
      away: awayStats.passes > 0
        ? `${Math.round((awayStats.passesComplete / awayStats.passes) * 100)}%`
        : '—',
    },
    {
      label: 'Tackles',
      home: homeStats.tackles,
      away: awayStats.tackles,
    },
  ]

  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Team Stats</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
            <th className="px-4 py-2 text-right w-1/3">{homeShort}</th>
            <th className="px-4 py-2 text-center w-1/3">Stat</th>
            <th className="px-4 py-2 text-left w-1/3">{awayShort}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">{row.home}</td>
              <td className="px-4 py-2 text-center text-gray-400">{row.label}</td>
              <td className="px-4 py-2 text-left font-semibold text-gray-900">{row.away}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function EventTimeline({
  events,
  match,
}: {
  events: MatchEvent[]
  match: MatchDetail
}) {
  // Show goals + shots only — filter to keep timeline concise
  const keyEvents = events
    .filter((e) => e.type === 'shot' || e.type === 'tackle' || e.type === 'dribble')
    .sort((a, b) => a.minute - b.minute)
    .slice(0, 40)

  if (keyEvents.length === 0) {
    return (
      <section className="bg-white rounded-2xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Key Events
        </h2>
        <p className="text-sm text-gray-400 text-center py-6">No key events</p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Key Events</h2>
      </div>
      <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {keyEvents.map((e) => {
          const isHome = match.lineups.some(
            (l) => l.player_id === e.player_id && l.team_id === match.home_team_id,
          )
          return (
            <li
              key={e.id}
              className={`flex items-center gap-3 px-4 py-2 text-sm ${
                isHome ? '' : 'flex-row-reverse'
              }`}
            >
              <span className="text-xs font-mono text-gray-400 shrink-0 w-8 text-center">
                {e.minute}'
              </span>
              <span className="text-base shrink-0">{EVENT_ICON[e.type] ?? '•'}</span>
              <div className={`flex-1 ${isHome ? '' : 'text-right'}`}>
                <Link
                  to={`/players/${e.player_id}`}
                  className="font-medium text-gray-800 hover:text-blue-600 transition-colors"
                >
                  {e.player.name}
                </Link>
                {e.outcome && (
                  <span className="ml-1 text-xs text-gray-400 capitalize">
                    ({e.outcome.replace('_', ' ')})
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function MatchReport() {
  const { id } = useParams<{ id: string }>()
  const matchId = Number(id)

  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) return
    async function load() {
      try {
        const [matchData, eventsData] = await Promise.all([
          fetchMatch(matchId),
          fetchMatchEvents(matchId),
        ])
        setMatch(matchData)
        setEvents(eventsData)
      } catch {
        setError('Failed to load match data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [matchId])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  }
  if (error || !match) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error ?? 'Match not found.'}
      </div>
    )
  }

  // Build player-id sets per team from lineups
  const homePlayerIds = new Set(
    match.lineups.filter((l) => l.team_id === match.home_team_id).map((l) => l.player_id),
  )
  const awayPlayerIds = new Set(
    match.lineups.filter((l) => l.team_id === match.away_team_id).map((l) => l.player_id),
  )

  const homeStats = computeTeamStats(events, homePlayerIds)
  const awayStats = computeTeamStats(events, awayPlayerIds)

  // Build pass data per team (only passes with end coords)
  const homePasses: PassPoint[] = events
    .filter(
      (e) =>
        e.type === 'pass' &&
        homePlayerIds.has(e.player_id) &&
        e.end_x != null &&
        e.end_y != null,
    )
    .map((e) => ({
      x: e.x,
      y: e.y,
      end_x: e.end_x!,
      end_y: e.end_y!,
      outcome: e.outcome ?? 'incomplete',
      player_name: e.player.name,
    }))

  const awayPasses: PassPoint[] = events
    .filter(
      (e) =>
        e.type === 'pass' &&
        awayPlayerIds.has(e.player_id) &&
        e.end_x != null &&
        e.end_y != null,
    )
    .map((e) => ({
      x: e.x,
      y: e.y,
      end_x: e.end_x!,
      end_y: e.end_y!,
      outcome: e.outcome ?? 'incomplete',
      player_name: e.player.name,
    }))

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
          ← Dashboard
        </Link>
      </div>

      {/* Score */}
      <ScoreHeader match={match} />

      {/* Lineups + Events + Team Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineupsTable match={match} />
        <div className="flex flex-col gap-6">
          <EventTimeline events={events} match={match} />
          <TeamStatsTable
            homeStats={homeStats}
            awayStats={awayStats}
            homeShort={match.home_team.short_name}
            awayShort={match.away_team.short_name}
          />
        </div>
      </div>

      {/* Pass maps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            {match.home_team.short_name} Pass Map
          </h2>
          {homePasses.length > 0 ? (
            <PassMap passes={homePasses} />
          ) : (
            <p className="text-sm text-gray-400 py-12 text-center">No pass data</p>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            {match.away_team.short_name} Pass Map
          </h2>
          {awayPasses.length > 0 ? (
            <PassMap passes={awayPasses} />
          ) : (
            <p className="text-sm text-gray-400 py-12 text-center">No pass data</p>
          )}
        </section>
      </div>
    </main>
  )
}
