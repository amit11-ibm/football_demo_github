import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface SquadBarDatum {
  name: string
  goals: number
  assists: number
}

interface Props {
  data: SquadBarDatum[]
  /** Maximum entries to show — defaults to 15 */
  limit?: number
}

export default function SquadBarChart({ data, limit = 15 }: Props) {
  const trimmed = data.slice(0, limit)

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, trimmed.length * 28)}>
      <BarChart
        layout="vertical"
        data={trimmed}
        margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11, fill: '#374151' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Bar dataKey="goals" name="Goals" radius={[0, 3, 3, 0]}>
          {trimmed.map((_, i) => (
            <Cell key={i} fill="#3b82f6" />
          ))}
        </Bar>
        <Bar dataKey="assists" name="Assists" radius={[0, 3, 3, 0]}>
          {trimmed.map((_, i) => (
            <Cell key={i} fill="#10b981" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
