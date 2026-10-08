/**
 * PassMap — pass-event overlay for PitchSVG.
 *
 * Each pass is rendered as a line from (x,y) → (end_x, end_y) with an
 * arrowhead at the destination:
 *   complete   → #3b82f6  (blue)
 *   incomplete → #ef4444  (red)
 *
 * Usage:
 *   <PassMap passes={passes} width={600} />
 */
import type { PassPoint } from '../../api/matches'
import PitchSVG, { type PitchSVGProps } from './PitchSVG'

const PW = 120
const PH = 80

const COMPLETE_COLOR   = '#3b82f6'
const INCOMPLETE_COLOR = '#ef4444'

const LEGEND_ITEMS = [
  { label: 'Complete',   color: COMPLETE_COLOR },
  { label: 'Incomplete', color: INCOMPLETE_COLOR },
]

interface PassMapProps extends Omit<PitchSVGProps, 'children'> {
  passes: PassPoint[]
}

/** Build an SVG arrowhead marker definition id. */
const MARKER_COMPLETE   = 'arrow-complete'
const MARKER_INCOMPLETE = 'arrow-incomplete'

export default function PassMap({ passes, width = 600, ...rest }: PassMapProps) {
  const pitchHeight = (width * PH) / PW
  const sx = width / PW
  const sy = pitchHeight / PH

  const scale = width / 600
  const markerSize = Math.max(3, 5 * scale)

  return (
    <div>
      <PitchSVG width={width} {...rest}>
        {/* Arrow marker defs — must be inside the SVG */}
        <defs>
          {([
            [MARKER_COMPLETE,   COMPLETE_COLOR],
            [MARKER_INCOMPLETE, INCOMPLETE_COLOR],
          ] as [string, string][]).map(([id, color]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth={markerSize}
              markerHeight={markerSize}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
        </defs>

        {passes.map((pass, i) => {
          const x1 = pass.x * sx
          const y1 = pass.y * sy
          const x2 = pass.end_x * sx
          const y2 = pass.end_y * sy
          const isComplete = pass.outcome === 'complete'
          const color  = isComplete ? COMPLETE_COLOR : INCOMPLETE_COLOR
          const marker = isComplete ? MARKER_COMPLETE : MARKER_INCOMPLETE

          return (
            <line
              key={i}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke={color}
              strokeWidth={Math.max(0.6, 1.2 * scale)}
              strokeOpacity={0.55}
              markerEnd={`url(#${marker})`}
            />
          )
        })}
      </PitchSVG>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {LEGEND_ITEMS.map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-xs text-gray-600">
            <span
              className="inline-block w-4 h-0.5"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
