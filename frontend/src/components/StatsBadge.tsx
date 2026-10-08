interface StatsBadgeProps {
  label: string
  value: string | number
  sub?: string
}

export default function StatsBadge({ label, value, sub }: StatsBadgeProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  )
}
