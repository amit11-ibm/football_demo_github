/**
 * Heatmap — binned touch-density overlay for PitchSVG.
 *
 * Usage:
 *   <PitchSVG width={600}>
 *     <HeatmapOverlay touches={touches} pitchWidth={600} />
 *   </PitchSVG>
 *
 * The overlay renders 10×8 coloured cells whose opacity is proportional to
 * the fraction of total touches that fell in that cell.  D3 is used only
 * for the colour scale; all rendering is React/SVG.
 */
import { interpolateYlOrRd } from 'd3-scale-chromatic'
import { scaleSequential } from 'd3-scale'
import type { TouchPoint } from '../../api/players'

// Grid dimensions (cells)
const COLS = 10
const ROWS = 8

// Pitch coordinate bounds
const PW = 120
const PH = 80

export interface HeatmapOverlayProps {
  touches: TouchPoint[]
  /** Pixel width of the parent PitchSVG — used to derive cell pixel sizes */
  pitchWidth: number
}

export default function HeatmapOverlay({ touches, pitchWidth }: HeatmapOverlayProps) {
  const pitchHeight = (pitchWidth * PH) / PW
  const cellW = pitchWidth / COLS
  const cellH = pitchHeight / ROWS

  // Bin touches into grid
  const counts = new Array<number>(COLS * ROWS).fill(0)
  for (const t of touches) {
    const col = Math.min(COLS - 1, Math.floor((t.x / PW) * COLS))
    const row = Math.min(ROWS - 1, Math.floor((t.y / PH) * ROWS))
    counts[row * COLS + col]++
  }

  const maxCount = Math.max(1, ...counts)

  // D3 sequential colour scale: 0 → transparent, max → deep orange/red
  const colorScale = scaleSequential(interpolateYlOrRd).domain([0, maxCount])

  return (
    <g style={{ mixBlendMode: 'multiply' }}>
      {counts.map((count, idx) => {
        if (count === 0) return null
        const col = idx % COLS
        const row = Math.floor(idx / COLS)
        const fill = colorScale(count)
        const opacity = 0.15 + (count / maxCount) * 0.7  // 0.15 → 0.85

        return (
          <rect
            key={idx}
            x={col * cellW}
            y={row * cellH}
            width={cellW}
            height={cellH}
            fill={fill}
            opacity={opacity}
          />
        )
      })}
    </g>
  )
}

// ── Standalone wrapper (pitch + heatmap) ─────────────────────────────────────
// This is the component consumed by pages.

import PitchSVG, { type PitchSVGProps } from './PitchSVG'

interface HeatmapProps extends Omit<PitchSVGProps, 'children'> {
  touches: TouchPoint[]
}

export function Heatmap({ touches, width = 600, ...rest }: HeatmapProps) {
  return (
    <PitchSVG width={width} {...rest}>
      <HeatmapOverlay touches={touches} pitchWidth={width} />
    </PitchSVG>
  )
}
