/**
 * ShotMap — shot-event overlay for PitchSVG.
 *
 * Dots are placed at (x, y) shot coordinates and coloured by outcome:
 *   goal        → #22c55e  (green)
 *   saved       → #eab308  (yellow)
 *   blocked     → #f97316  (orange)
 *   off_target  → #ef4444  (red)
 *
 * Dot radius scales with proximity to goal (closer = larger).
 *
 * Usage:
 *   <ShotMap shots={shots} width={600} />
 */
import type { ShotPoint } from '../../api/players'
import PitchSVG, { type PitchSVGProps } from './PitchSVG'

const PW = 120
const PH = 80

// Goal mouth centres (x=0 and x=120, y=40)
const GOAL_CENTRE_Y = PH / 2

const OUTCOME_COLOR: Record<string, string> = {
  goal:       '#22c55e',
  saved:      '#eab308',
  blocked:    '#f97316',
  off_target: '#ef4444',
}

const LEGEND_ITEMS = [
  { label: 'Goal',       color: OUTCOME_COLOR.goal },
  { label: 'Saved',      color: OUTCOME_COLOR.saved },
  { label: 'Blocked',    color: OUTCOME_COLOR.blocked },
  { label: 'Off target', color: OUTCOME_COLOR.off_target },
]

interface ShotMapProps extends Omit<PitchSVGProps, 'children'> {
  shots: ShotPoint[]
}

export default function ShotMap({ shots, width = 600, ...rest }: ShotMapProps) {
  const pitchHeight = (width * PH) / PW
  const sx = width / PW
  const sy = pitchHeight / PH

  return (
    <div>
      <PitchSVG width={width} {...rest}>
        {shots.map((shot, i) => {
          const cx = shot.x * sx
          const cy = shot.y * sy
          const fill = OUTCOME_COLOR[shot.outcome] ?? OUTCOME_COLOR.off_target

          // Distance to nearest goal (x=0 or x=120)
          const distLeft  = Math.hypot(shot.x, shot.y - GOAL_CENTRE_Y)
          const distRight = Math.hypot(PW - shot.x, shot.y - GOAL_CENTRE_Y)
          const dist = Math.min(distLeft, distRight)

          // Radius: 3–9 px based on distance (closer = bigger)
          const maxDist = Math.hypot(PW, PH)
          const r = 3 + (1 - dist / maxDist) * 6

          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={r * (width / 600)}
                fill={fill}
                fillOpacity={0.8}
                stroke="#fff"
                strokeWidth={0.8 * (width / 600)}
              />
              {/* Minute label on hover via <title> */}
              <title>{`${shot.outcome} — min ${shot.minute}`}</title>
            </g>
          )
        })}
      </PitchSVG>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {LEGEND_ITEMS.map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-xs text-gray-600">
            <span
              className="inline-block w-3 h-3 rounded-full border border-white"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
