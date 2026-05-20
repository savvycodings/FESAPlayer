import { SPACING } from '../constants/layout'

/** Same column breakpoints as profile ProductGrid */
export function listingGridColumns(width: number, override?: number): number {
  if (override != null) return override
  if (width >= 720) return 5
  if (width >= 600) return 4
  return 3
}

/** Tile width for grids inside a screen with horizontal containerPadding */
export function listingTileWidth(screenWidth: number, columns?: number): number {
  const cols = listingGridColumns(screenWidth, columns)
  const gap = SPACING.gridColumnGap
  const totalGap = gap * (cols - 1)
  const available = screenWidth - SPACING.containerPadding * 2 - totalGap
  return Math.floor(available / cols)
}
