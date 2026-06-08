import { useContext, useMemo } from 'react'
import { ThemeContext } from '../../context'
import { PROFILE_CHART_ACCENT } from '../../constants/layout'

/** bklit-aligned chart tokens — wizards green on dark HUD surfaces */
export type ChartThemeTokens = {
  linePrimary: string
  lineSecondary: string
  grid: string
  gridStrong: string
  crosshair: string
  axisLabel: string
  tooltipBg: string
  tooltipBorder: string
  tooltipMuted: string
  brushSelection: string
  brushSelectionBorder: string
  brushHandle: string
  brushHandleBorder: string
  brushDim: [string, string]
  dotStroke: string
  areaFillOpacity: number
  areaFillOpacityBrush: number
  strokeWidth: number
  strokeWidthBrush: number
}

export const CHART_LAYOUT = {
  yAxisWidth: 50,
  paddingLeft: 15,
  paddingTop: 20,
  paddingBottom: 35,
  paddingTopBrush: 6,
  paddingBottomBrush: 6,
  brushHeight: 72,
  mainHeight: 200,
  minBrushPoints: 3,
  /** Invisible touch radius around each handle center (px) */
  handleHit: 44,
  /** Visible pill width (px) */
  handleWidth: 10,
  /** Visible pill height as ratio of brush strip height */
  handleHeightRatio: 0.52,
} as const

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  const h = hex.replace('#', '')
  if (h.length === 3) {
    const [r, g, b] = h.split('')
    return `#${r}${r}${g}${g}${b}${b}${a}`
  }
  return `#${h.slice(0, 6)}${a}`
}

export function createChartTheme(accent = PROFILE_CHART_ACCENT): ChartThemeTokens {
  return {
    linePrimary: accent,
    lineSecondary: withAlpha(accent, 0.55),
    grid: 'rgba(255, 255, 255, 0.1)',
    gridStrong: 'rgba(255, 255, 255, 0.22)',
    crosshair: withAlpha(accent, 0.5),
    axisLabel: 'rgba(255, 255, 255, 0.6)',
    tooltipBg: 'rgba(0, 0, 0, 0.88)',
    tooltipBorder: 'rgba(255, 255, 255, 0.1)',
    tooltipMuted: 'rgba(255, 255, 255, 0.7)',
    brushSelection: withAlpha(accent, 0.1),
    brushSelectionBorder: 'rgba(255, 255, 255, 0.35)',
    brushHandle: '#3d3d3d',
    brushHandleBorder: 'rgba(255, 255, 255, 0.28)',
    brushDim: ['rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.32)'],
    dotStroke: '#000000',
    areaFillOpacity: 0.12,
    areaFillOpacityBrush: 0.18,
    strokeWidth: 2.5,
    strokeWidthBrush: 1.5,
  }
}

/** Resolves chart colors from ThemeContext (wizards tint) + portfolio accent */
export function useChartTheme(accentOverride?: string): ChartThemeTokens {
  const { theme } = useContext(ThemeContext)
  return useMemo(() => {
    const accent =
      accentOverride ??
      (theme.tintColor === '#73EC8B' || theme.label === 'wizards'
        ? PROFILE_CHART_ACCENT
        : theme.tintColor || PROFILE_CHART_ACCENT)
    return createChartTheme(accent)
  }, [accentOverride, theme.tintColor, theme.label])
}
