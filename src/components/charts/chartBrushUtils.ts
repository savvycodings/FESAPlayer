import type { ChartDataPoint } from './PortfolioLineChart'
import { CHART_LAYOUT } from './chartTheme'

export type BrushSelection = { startIndex: number; endIndex: number }

export const CHART_PADDING_LEFT = CHART_LAYOUT.paddingLeft
export const Y_AXIS_WIDTH = CHART_LAYOUT.yAxisWidth
export const MIN_BRUSH_POINTS = CHART_LAYOUT.minBrushPoints

export function indexToX(
  index: number,
  dataLength: number,
  graphWidth: number,
  paddingLeft = CHART_PADDING_LEFT,
): number {
  if (dataLength <= 1) return paddingLeft + graphWidth / 2
  return paddingLeft + (index / (dataLength - 1)) * graphWidth
}

export function xToIndex(
  x: number,
  dataLength: number,
  graphWidth: number,
  paddingLeft = CHART_PADDING_LEFT,
): number {
  if (dataLength <= 1) return 0
  const clamped = Math.max(paddingLeft, Math.min(paddingLeft + graphWidth, x))
  const t = graphWidth <= 0 ? 0 : (clamped - paddingLeft) / graphWidth
  return Math.round(t * (dataLength - 1))
}

export function defaultBrushSelection(dataLength: number): BrushSelection {
  if (dataLength <= 0) return { startIndex: 0, endIndex: 0 }
  if (dataLength <= MIN_BRUSH_POINTS) {
    return { startIndex: 0, endIndex: dataLength - 1 }
  }
  const span = Math.max(MIN_BRUSH_POINTS, Math.ceil(dataLength * 0.45))
  return {
    startIndex: Math.max(0, dataLength - span),
    endIndex: dataLength - 1,
  }
}

export function sliceBrushData<T>(items: T[] | undefined, selection: BrushSelection): T[] {
  if (!items || items.length === 0) return []
  const end = Math.min(selection.endIndex, items.length - 1)
  const start = Math.max(0, Math.min(selection.startIndex, end))
  return items.slice(start, end + 1)
}

export function clampSelection(
  selection: BrushSelection,
  dataLength: number,
  minPoints = MIN_BRUSH_POINTS,
): BrushSelection {
  if (dataLength <= 0) return { startIndex: 0, endIndex: 0 }
  const maxIndex = dataLength - 1
  let start = Math.max(0, Math.min(selection.startIndex, maxIndex))
  let end = Math.max(0, Math.min(selection.endIndex, maxIndex))
  if (start > end) [start, end] = [end, start]
  if (end - start + 1 < minPoints) {
    if (end + (minPoints - 1) <= maxIndex) {
      end = Math.min(maxIndex, start + minPoints - 1)
    } else {
      start = Math.max(0, end - minPoints + 1)
    }
  }
  return { startIndex: start, endIndex: end }
}

export function remapChartDataSlice(data: ChartDataPoint[], selection: BrushSelection): ChartDataPoint[] {
  const sliced = sliceBrushData(data, selection)
  return sliced.map((point, index) => ({ x: index, y: point.y }))
}
