import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface FormDataPoint {
  /** Display label on x-axis — typically a short date or match label */
  label: string
  goals: number
  assists: number
}

interface Props {
  data: FormDataPoint[]
}

export default function FormLineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="goals"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Goals"
        />
        <Line
          type="monotone"
          dataKey="assists"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Assists"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
