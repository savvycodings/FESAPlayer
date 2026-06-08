import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { View, LayoutChangeEvent, PanResponder } from 'react-native'
import Svg, { Circle, Path, Line } from 'react-native-svg'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { FocalBrackets } from '../ui/FocalBrackets'
import { SPACING, PROFILE_CHART_ACCENT } from '../../constants/layout'
import { useChartTheme, CHART_LAYOUT } from './chartTheme'
import { ChartTooltip } from './ChartTooltip'
import { formatChartDateShort, getChartTickIndices } from './chartFormat'

export type ChartPeriod = '1M' | '3M' | '6M' | '1Y'

export interface ChartDataPoint {
  x: number
  y: number
}

export type PortfolioLineChartVariant = 'default' | 'brush'

export interface PortfolioLineChartProps {
  data: ChartDataPoint[]
  dates?: string[]
  period?: ChartPeriod
  accentColor?: string
  height?: number
  maxChartWidth?: number
  roundYAxisThousands?: boolean
  compact?: boolean
  variant?: PortfolioLineChartVariant
  framed?: boolean
  interactive?: boolean
  /** Bottom date ticks when dates[] is provided */
  showXAxis?: boolean
  xAxisTickCount?: number
}

function roundToNiceNumber(num: number, roundUp: boolean): number {
  if (num === 0) return 0
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)))
  const normalized = num / magnitude
  let rounded: number
  if (roundUp) {
    if (normalized <= 1) rounded = 1
    else if (normalized <= 2) rounded = 2
    else if (normalized <= 5) rounded = 5
    else rounded = 10
  } else {
    if (normalized >= 10) rounded = 10
    else if (normalized >= 5) rounded = 5
    else if (normalized >= 2) rounded = 2
    else rounded = 1
  }
  return rounded * magnitude
}

function formatZar(value: number): string {
  return `R${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function formatTooltipDate(
  index: number,
  total: number,
  period: ChartPeriod,
  dates: string[] | undefined,
  isSingleDayView: boolean,
): string {
  if (isSingleDayView) return 'Today'
  const dateStr = dates?.[index]
  if (dateStr) {
    try {
      const d = new Date(dateStr)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    } catch (_) {}
  }
  const now = new Date()
  const date = new Date(now)
  if (period === '1M') {
    date.setDate(now.getDate() - (total - 1 - index))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (period === '3M') {
    date.setDate(now.getDate() - (90 - Math.floor((90 / (total - 1)) * index)))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (period === '6M') {
    date.setDate(now.getDate() - (180 - Math.floor((180 / (total - 1)) * index)))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  date.setDate(now.getDate() - (365 - Math.floor((365 / (total - 1)) * index)))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PortfolioLineChart({
  data,
  dates,
  period = '1M',
  accentColor = PROFILE_CHART_ACCENT,
  height = CHART_LAYOUT.mainHeight,
  maxChartWidth,
  roundYAxisThousands = false,
  compact = false,
  variant = 'default',
  framed = variant === 'default',
  interactive = variant === 'default',
  showXAxis,
  xAxisTickCount = 4,
}: PortfolioLineChartProps) {
  const { theme } = useContext(ThemeContext)
  const tokens = useChartTheme(accentColor)
  const isBrush = variant === 'brush'

  const [chartWidth, setChartWidth] = useState(0)
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; value: number; index: number } | null>(null)

  useEffect(() => {
    setSelectedPoint(null)
  }, [data, dates, period])

  const chartHeight = height
  const chartPaddingLeft = isBrush ? 4 : 8
  const chartPaddingRight = 4
  const chartPaddingTop = isBrush ? CHART_LAYOUT.paddingTopBrush : CHART_LAYOUT.paddingTop
  const chartPaddingBottom = isBrush ? CHART_LAYOUT.paddingBottomBrush : CHART_LAYOUT.paddingBottom
  const svgWidth = Math.max(0, chartWidth)
  const graphWidth = Math.max(0, svgWidth - chartPaddingLeft - chartPaddingRight)
  const graphHeight = Math.max(0, chartHeight - chartPaddingTop - chartPaddingBottom)

  const hasData = data.length > 0
  const isSingleDayView = hasData && data.every((point) => point.y === data[0].y)
  const showXAxisLabels = showXAxis ?? (!isBrush && (dates?.length ?? 0) > 0)

  const xAxisTicks = useMemo(() => {
    if (!showXAxisLabels || !dates?.length) return [] as { index: number; x: number; label: string }[]
    const indices = getChartTickIndices(data.length, xAxisTickCount)
    return indices.map((index) => {
      const xPosition =
        data.length === 1
          ? chartPaddingLeft + graphWidth / 2
          : chartPaddingLeft + (index / (data.length - 1 || 1)) * graphWidth
      const label =
        dates[index] && dates[index].length > 0
          ? formatChartDateShort(dates[index])
          : formatTooltipDate(index, data.length, period, dates, isSingleDayView)
      return { index, x: xPosition, label }
    })
  }, [
    showXAxisLabels,
    dates,
    data.length,
    xAxisTickCount,
    chartPaddingLeft,
    graphWidth,
    period,
    isSingleDayView,
  ])

  const {
    gridLines,
    normalizedPoints,
    chartPathData,
    chartPathValid,
    fillLeftX,
    fillRightX,
    fillBottomY,
  } = useMemo(() => {
    if (!hasData || chartWidth <= 0) {
      return {
        gridLines: [] as { y: number; value: number }[],
        normalizedPoints: [] as { x: number; y: number; value: number; index: number }[],
        chartPathData: '',
        chartPathValid: false,
        fillLeftX: 0,
        fillRightX: 0,
        fillBottomY: chartHeight - chartPaddingBottom,
      }
    }

    const maxValue = Math.max(...data.map((d) => d.y))
    const minValue = Math.min(...data.map((d) => d.y))
    const padding =
      (maxValue === minValue ? maxValue * 0.1 : (maxValue - minValue) * 0.1) || (roundYAxisThousands ? 2000 : 50)
    const chartMin = Math.max(0, roundToNiceNumber(minValue - padding, false))
    const chartMax = roundToNiceNumber(maxValue + padding, true)
    const valueRange = chartMax - chartMin || 1

    const gridCount = 5
    const gridStep = valueRange / (gridCount - 1)
    const grid = Array.from({ length: gridCount }, (_, i) => {
      const value = chartMin + gridStep * i
      const rounded = roundYAxisThousands ? Math.round(value / 1000) * 1000 : Math.round(value)
      const y = chartHeight - chartPaddingBottom - ((value - chartMin) / valueRange) * graphHeight
      return { y, value: rounded }
    })

    const points = data.map((point, index) => {
      const xPosition =
        data.length === 1
          ? chartPaddingLeft + graphWidth / 2
          : chartPaddingLeft + (index / (data.length - 1 || 1)) * graphWidth
      return {
        x: xPosition,
        y: chartHeight - chartPaddingBottom - ((point.y - chartMin) / valueRange) * graphHeight,
        value: point.y,
        index,
      }
    })

    let path = ''
    if (points.length === 1) {
      path = `M ${chartPaddingLeft} ${points[0].y} L ${chartPaddingLeft + graphWidth} ${points[0].y}`
    } else {
      path = points.reduce((acc, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`
        return `${acc} L ${point.x} ${point.y}`
      }, '')
    }

    const pathValid = Boolean(
      path && !/NaN|Infinity/i.test(path) && points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    )

    const leftX = points.length === 1 ? chartPaddingLeft : points[0].x
    const rightX = points.length === 1 ? chartPaddingLeft + graphWidth : points[points.length - 1].x

    return {
      gridLines: grid,
      normalizedPoints: points,
      chartPathData: path,
      chartPathValid: pathValid,
      fillLeftX: leftX,
      fillRightX: rightX,
      fillBottomY: chartHeight - chartPaddingBottom,
    }
  }, [
    data,
    hasData,
    chartWidth,
    chartHeight,
    chartPaddingBottom,
    graphWidth,
    graphHeight,
    chartPaddingLeft,
    roundYAxisThousands,
  ])

  const handleChartLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    if (width <= 0) return
    const capped = maxChartWidth ? Math.min(width, maxChartWidth) : width
    setChartWidth(capped)
  }

  const handleTouch = useCallback(
    (locationX: number) => {
      if (!hasData || normalizedPoints.length === 0) {
        setSelectedPoint(null)
        return
      }
      const touchX = locationX
      if (touchX < chartPaddingLeft - 12 || touchX > chartPaddingLeft + graphWidth + 12) {
        setSelectedPoint(null)
        return
      }
      const closestPoint = normalizedPoints.reduce((prev, curr) =>
        Math.abs(curr.x - touchX) < Math.abs(prev.x - touchX) ? curr : prev,
      )
      setSelectedPoint({
        x: closestPoint.x,
        value: closestPoint.value,
        index: closestPoint.index,
      })
    },
    [hasData, normalizedPoints, chartPaddingLeft, graphWidth],
  )

  const panResponder = useMemo(
    () =>
      interactive
        ? PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
            onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
            onPanResponderRelease: () => {},
          })
        : null,
    [handleTouch, interactive],
  )

  if (!hasData || chartWidth <= 0) {
    return <View className="w-full" style={{ height: chartHeight }} onLayout={handleChartLayout} />
  }

  if (!chartPathValid) return null

  const bracketLength = compact ? 12 : 16
  const fillOpacity = isBrush ? tokens.areaFillOpacityBrush : tokens.areaFillOpacity
  const strokeWidth = isBrush ? tokens.strokeWidthBrush : tokens.strokeWidth

  const chartBody = (
    <View
      className="w-full self-stretch"
      style={{ height: chartHeight }}
      onLayout={handleChartLayout}
      pointerEvents={isBrush ? 'none' : 'auto'}
    >
      <View
        className="relative w-full overflow-visible"
        style={{ height: chartHeight }}
        {...(panResponder ? panResponder.panHandlers : {})}
      >
        <Svg width={svgWidth} height={chartHeight}>
          {!isBrush
            ? gridLines.map((grid, index) => {
                const isBottomLine = index === 0
                return (
                  <Line
                    key={index}
                    x1={chartPaddingLeft}
                    y1={grid.y}
                    x2={chartPaddingLeft + graphWidth}
                    y2={grid.y}
                    stroke={isBottomLine ? tokens.gridStrong : tokens.grid}
                    strokeWidth={1}
                  />
                )
              })
            : null}

          {normalizedPoints.length > 0 && (
            <Path
              d={`${chartPathData} L ${fillRightX} ${fillBottomY} L ${fillLeftX} ${fillBottomY} Z`}
              fill={tokens.linePrimary}
              fillOpacity={fillOpacity}
            />
          )}

          <Path
            d={chartPathData}
            stroke={tokens.linePrimary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {interactive && selectedPoint && (
            <Line
              x1={selectedPoint.x}
              y1={chartPaddingTop}
              x2={selectedPoint.x}
              y2={chartHeight - chartPaddingBottom}
              stroke={tokens.linePrimary}
              strokeWidth={1}
              strokeOpacity={0.5}
              strokeDasharray={[4, 4]}
            />
          )}

          {interactive && selectedPoint && normalizedPoints[selectedPoint.index] && (
            <Circle
              cx={selectedPoint.x}
              cy={normalizedPoints[selectedPoint.index].y}
              r={4}
              fill={tokens.linePrimary}
              stroke={tokens.dotStroke}
              strokeWidth={1}
            />
          )}

          {interactive &&
            normalizedPoints.length === 1 &&
            normalizedPoints.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={5}
                fill={tokens.linePrimary}
                stroke={tokens.dotStroke}
                strokeWidth={2}
              />
            ))}
        </Svg>

        {showXAxisLabels
          ? xAxisTicks.map((tick) => (
              <Text
                key={tick.index}
                style={{
                  position: 'absolute',
                  left: Math.max(0, tick.x - 22),
                  top: chartHeight - 16,
                  width: 44,
                  fontSize: isBrush ? 9 : 10,
                  fontFamily: theme.regularFont,
                  color: tokens.axisLabel,
                  textAlign: 'center',
                }}
              >
                {tick.label}
              </Text>
            ))
          : null}

        {interactive && selectedPoint && normalizedPoints[selectedPoint.index] && (
          <ChartTooltip
            accentColor={accentColor}
            dateLabel={formatTooltipDate(
              selectedPoint.index,
              data.length,
              period,
              dates,
              isSingleDayView,
            )}
            valueLabel={formatZar(selectedPoint.value)}
            style={{
              left: Math.max(4, Math.min(selectedPoint.x - 44, svgWidth - 92)),
              top: Math.max(4, normalizedPoints[selectedPoint.index].y - 52),
            }}
          />
        )}
      </View>
    </View>
  )

  if (!framed) return chartBody

  return (
    <FocalBrackets
      accentColor={tokens.linePrimary}
      bracketLength={bracketLength}
      bracketThickness={2}
      offset={2}
      style={{ width: '100%', alignSelf: 'stretch', alignItems: 'stretch' as const, marginTop: SPACING.xs }}
    >
      {chartBody}
    </FocalBrackets>
  )
}
