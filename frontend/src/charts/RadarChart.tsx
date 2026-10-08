import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { StatsSummary } from '../api/players'

// Normalise each attribute to a 0–100 scale using sensible MVP ceilings
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

interface Props {
  stats: StatsSummary
  color?: string
}

export default function PlayerRadarChart({ stats, color = '#3b82f6' }: Props) {
  const data = [
    { attribute: 'Goals', value: normalise(stats.goals, CEILINGS['Goals']) },
    { attribute: 'Assists', value: normalise(stats.assists, CEILINGS['Assists']) },
    { attribute: 'Pass Acc.', value: normalise(stats.pass_accuracy, CEILINGS['Pass Acc.']) },
    { attribute: 'Shots OT', value: normalise(stats.shots_on_target, CEILINGS['Shots OT']) },
    { attribute: 'Dist. (km)', value: normalise(stats.distance_covered, CEILINGS['Dist. (km)']) },
    { attribute: 'Matches', value: normalise(stats.matches_played, CEILINGS['Matches']) },
  ]

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsRadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
          dot={{ r: 3, fill: color }}
        />
        <Tooltip
          formatter={(v: number) => [`${v} / 100`, 'Score']}
          contentStyle={{ fontSize: 12 }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}
