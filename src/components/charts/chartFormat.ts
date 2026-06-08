/** Format ISO date string for chart axis / range labels */
export function formatChartDateShort(dateStr: string | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function formatChartDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
): string {
  const start = formatChartDateShort(startDate)
  const end = formatChartDateShort(endDate)
  if (!start && !end) return ''
  if (start === end) return start
  if (!start) return end
  if (!end) return start
  return `${start} – ${end}`
}

/** Evenly spaced tick indices for x-axis labels */
export function getChartTickIndices(dataLength: number, tickCount = 4): number[] {
  if (dataLength <= 0) return []
  if (dataLength === 1) return [0]
  if (dataLength <= tickCount) {
    return Array.from({ length: dataLength }, (_, i) => i)
  }
  return Array.from({ length: tickCount }, (_, i) =>
    Math.round((i / (tickCount - 1)) * (dataLength - 1)),
  )
}
