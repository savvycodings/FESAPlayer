export type PortfolioChange = {
  change: number
  changePercent: string
  hasHistory: boolean
}

/** Latest vs previous point — shared by shop header and profile portfolio value */
export function computePortfolioChange(
  series: { y: number }[],
  fallbackValue = 0,
): PortfolioChange {
  const hasHistory = series.length > 1
  const latest = hasHistory ? (series[series.length - 1]?.y ?? 0) : fallbackValue
  const previous = hasHistory ? (series[series.length - 2]?.y ?? 0) : 0
  const change = latest - previous
  const changePercent = previous !== 0 ? ((change / previous) * 100).toFixed(1) : '0.0'
  return { change, changePercent, hasHistory }
}
