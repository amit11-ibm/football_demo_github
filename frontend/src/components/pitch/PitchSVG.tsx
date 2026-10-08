/**
 * PitchSVG — base football pitch (120 × 80 coordinate units).
 *
 * Coordinate system matches the backend seed data:
 *   x  0 → 120  (left goal-line → right goal-line)
 *   y  0 → 80   (top touchline → bottom touchline)
 *
 * Accepts a `width` prop (px); height is derived proportionally.
 * All markings are plain SVG primitives — no external images.
 * D3 is NOT used here; pure SVG math only.
 */

export interface PitchSVGProps {
  /** Rendered width in pixels. Height derived as width * (80/120). */
  width?: number
  children?: React.ReactNode
  fillColor?: string
  lineColor?: string
}

// ── Pitch constants (coordinate units) ───────────────────────────────────────
const PW = 120
const PH = 80

const PA_DEPTH = 16.5
const PA_WIDTH = 40.32
const PA_Y1 = (PH - PA_WIDTH) / 2       // 19.84

const GA_DEPTH = 5.5
const GA_WIDTH = 18.32
const GA_Y1 = (PH - GA_WIDTH) / 2       // 30.84

const GOAL_WIDTH = 7.32
const GOAL_DEPTH = 2
const GOAL_Y1 = (PH - GOAL_WIDTH) / 2   // 36.34

const CC_R = 9.15
const PEN_X = 11
const PEN_ARC_R = CC_R
const CORNER_R = 1

// ── Component ────────────────────────────────────────────────────────────────
export default function PitchSVG({
  width = 700,
  children,
  fillColor = '#2d7a3f',
  lineColor = 'rgba(255,255,255,0.85)',
}: PitchSVGProps) {
  const height = (width * PH) / PW
  const sx = width / PW   // x scale factor
  const sy = height / PH  // y scale factor

  // Scale a point
  const px = (x: number) => x * sx
  const py = (y: number) => y * sy

  const sw = Math.max(0.8, width / 700)  // stroke width
  const lp = { stroke: lineColor, strokeWidth: sw, fill: 'none' } as const

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: 'block' }}
      aria-label="Football pitch"
    >
      {/* Pitch surface */}
      <rect x={0} y={0} width={width} height={height} fill={fillColor} />

      {/* Alternating grass stripes — 10 bands */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x={i * (width / 10)}
          y={0}
          width={width / 10}
          height={height}
          fill={i % 2 === 0 ? 'rgba(0,0,0,0.07)' : 'none'}
        />
      ))}

      {/* Pitch outline */}
      <rect x={0} y={0} width={width} height={height} {...lp} />

      {/* Halfway line */}
      <line x1={px(PW / 2)} y1={0} x2={px(PW / 2)} y2={height} {...lp} />

      {/* Centre circle */}
      <circle cx={px(PW / 2)} cy={py(PH / 2)} r={CC_R * sx} {...lp} />
      <circle cx={px(PW / 2)} cy={py(PH / 2)} r={sw * 2} fill={lineColor} stroke="none" />

      {/* ── Left side ── */}
      {/* Penalty area */}
      <rect
        x={0} y={py(PA_Y1)}
        width={px(PA_DEPTH)} height={py(PA_WIDTH)}
        {...lp}
      />
      {/* 6-yard box */}
      <rect
        x={0} y={py(GA_Y1)}
        width={px(GA_DEPTH)} height={py(GA_WIDTH)}
        {...lp}
      />
      {/* Penalty spot */}
      <circle cx={px(PEN_X)} cy={py(PH / 2)} r={sw * 2} fill={lineColor} stroke="none" />
      {/* Penalty arc (D) */}
      <path d={buildPenArc(PEN_X, PH / 2, PEN_ARC_R, 'left', sx, sy)} {...lp} />
      {/* Goal */}
      <rect
        x={px(-GOAL_DEPTH)} y={py(GOAL_Y1)}
        width={px(GOAL_DEPTH)} height={py(GOAL_WIDTH)}
        stroke={lineColor} strokeWidth={sw} fill="rgba(255,255,255,0.12)"
      />

      {/* ── Right side ── */}
      {/* Penalty area */}
      <rect
        x={px(PW - PA_DEPTH)} y={py(PA_Y1)}
        width={px(PA_DEPTH)} height={py(PA_WIDTH)}
        {...lp}
      />
      {/* 6-yard box */}
      <rect
        x={px(PW - GA_DEPTH)} y={py(GA_Y1)}
        width={px(GA_DEPTH)} height={py(GA_WIDTH)}
        {...lp}
      />
      {/* Penalty spot */}
      <circle cx={px(PW - PEN_X)} cy={py(PH / 2)} r={sw * 2} fill={lineColor} stroke="none" />
      {/* Penalty arc (D) */}
      <path d={buildPenArc(PW - PEN_X, PH / 2, PEN_ARC_R, 'right', sx, sy)} {...lp} />
      {/* Goal */}
      <rect
        x={px(PW)} y={py(GOAL_Y1)}
        width={px(GOAL_DEPTH)} height={py(GOAL_WIDTH)}
        stroke={lineColor} strokeWidth={sw} fill="rgba(255,255,255,0.12)"
      />

      {/* Corner arcs */}
      <path d={buildCornerArc(0,  0,  CORNER_R, sx, sy, 0)}   stroke={lineColor} strokeWidth={sw} fill="none" />
      <path d={buildCornerArc(PW, 0,  CORNER_R, sx, sy, 90)}  stroke={lineColor} strokeWidth={sw} fill="none" />
      <path d={buildCornerArc(0,  PH, CORNER_R, sx, sy, 270)} stroke={lineColor} strokeWidth={sw} fill="none" />
      <path d={buildCornerArc(PW, PH, CORNER_R, sx, sy, 180)} stroke={lineColor} strokeWidth={sw} fill="none" />

      {/* Overlays go last so they sit above pitch markings */}
      {children}
    </svg>
  )
}

// ── SVG path builders ─────────────────────────────────────────────────────────

function toRad(deg: number) { return (deg * Math.PI) / 180 }

/**
 * Penalty arc — 106° sweep of the circle centred on the penalty spot,
 * drawn only on the outer side of the penalty area.
 */
function buildPenArc(
  penX: number, penY: number,
  r: number,
  side: 'left' | 'right',
  sx: number, sy: number,
): string {
  // Sweep angles (degrees) measured from the positive-x axis.
  // Left side: arc opens to the right (toward centre), sweeps ~−53° → +53°
  // Right side: mirror — sweeps 127° → 233°
  const a1 = side === 'left' ? -53 : 127
  const a2 = side === 'left' ?  53 : 233
  const x1 = penX * sx + r * sx * Math.cos(toRad(a1))
  const y1 = penY * sy + r * sy * Math.sin(toRad(a1))
  const x2 = penX * sx + r * sx * Math.cos(toRad(a2))
  const y2 = penY * sy + r * sy * Math.sin(toRad(a2))
  const sweep = side === 'left' ? 1 : 0
  return `M ${x1} ${y1} A ${r * sx} ${r * sy} 0 0 ${sweep} ${x2} ${y2}`
}

/**
 * Corner arc — quarter-circle of radius r at a corner.
 * `startDeg` is the angle of the first point of the arc.
 */
function buildCornerArc(
  cx: number, cy: number,
  r: number,
  sx: number, sy: number,
  startDeg: number,
): string {
  const a1 = startDeg
  const a2 = startDeg + 90
  const x1 = cx * sx + r * sx * Math.cos(toRad(a1))
  const y1 = cy * sy + r * sy * Math.sin(toRad(a1))
  const x2 = cx * sx + r * sx * Math.cos(toRad(a2))
  const y2 = cy * sy + r * sy * Math.sin(toRad(a2))
  return `M ${x1} ${y1} A ${r * sx} ${r * sy} 0 0 1 ${x2} ${y2}`
}
