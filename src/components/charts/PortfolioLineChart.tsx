import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, LayoutChangeEvent, PanResponder, Dimensions } from 'react-native'
import Svg, { Circle, Path, Line } from 'react-native-svg'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { FocalBrackets } from '../ui/FocalBrackets'
import { SPACING, TYPOGRAPHY, RADIUS, PROFILE_CHART_ACCENT } from '../../constants/layout'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export type ChartPeriod = '1M' | '3M' | '6M' | '1Y'

export interface ChartDataPoint {
  x: number
  y: number
}

export interface PortfolioLineChartProps {
  data: ChartDataPoint[]
  dates?: string[]
  period?: ChartPeriod
  accentColor?: string
  height?: number
  /** Clamp chart width (defaults to screen minus container padding) */
  maxChartWidth?: number
  /** Profile portfolio Y-axis rounds to nearest 1k */
  roundYAxisThousands?: boolean
  compact?: boolean
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
  height = 200,
  maxChartWidth = SCREEN_WIDTH - SPACING.containerPadding * 2,
  roundYAxisThousands = false,
  compact = false,
}: PortfolioLineChartProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, height)

  const [chartWidth, setChartWidth] = useState(maxChartWidth)
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; value: number; index: number } | null>(null)

  useEffect(() => {
    setSelectedPoint(null)
  }, [data, dates, period])

  const chartHeight = height
  const yAxisWidth = 50
  const chartPaddingLeft = 15
  const chartPaddingRight = 0
  const chartPaddingTop = 20
  const chartPaddingBottom = 35
  const svgWidth = Math.max(0, chartWidth - yAxisWidth)
  const graphWidth = Math.max(0, svgWidth - chartPaddingLeft - chartPaddingRight)
  const graphHeight = Math.max(0, chartHeight - chartPaddingTop - chartPaddingBottom)

  const hasData = data.length > 0
  const isSingleDayView = hasData && data.every((point) => point.y === data[0].y)

  const {
    gridLines,
    normalizedPoints,
    chartPathData,
    chartPathValid,
    fillLeftX,
    fillRightX,
    fillBottomY,
  } = useMemo(() => {
    if (!hasData) {
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
    chartHeight,
    chartPaddingBottom,
    graphWidth,
    graphHeight,
    chartPaddingLeft,
    roundYAxisThousands,
  ])

  const handleChartLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setChartWidth(Math.min(width, maxChartWidth))
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
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
        onPanResponderRelease: () => {},
      }),
    [handleTouch],
  )

  if (!hasData || !chartPathValid) return null

  const bracketLength = compact ? 12 : 16

  return (
    <FocalBrackets
      accentColor={accentColor}
      bracketLength={bracketLength}
      bracketThickness={2}
      offset={2}
      style={styles.focalFrame}
    >
      <View style={styles.chartSection} onLayout={handleChartLayout}>
        <View style={styles.chartWrapper}>
          <View style={[styles.yAxisContainer, { height: chartHeight }]}>
            {[...gridLines].reverse().map((grid, index) => (
              <Text
                key={index}
                style={[
                  styles.yAxisLabel,
                  {
                    position: 'absolute',
                    top: Number.isFinite(grid.y) ? Math.max(0, grid.y - 6) : 0,
                  },
                ]}
              >
                {formatZar(grid.value)}
              </Text>
            ))}
          </View>

          <View
            style={[styles.chartSvgContainer, { height: chartHeight }]}
            {...panResponder.panHandlers}
          >
            <Svg width={svgWidth} height={chartHeight}>
              {gridLines.map((grid, index) => {
                const isBottomLine = index === 0
                return (
                  <Line
                    key={index}
                    x1={chartPaddingLeft}
                    y1={grid.y}
                    x2={chartPaddingLeft + graphWidth}
                    y2={grid.y}
                    stroke={isBottomLine ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth={1}
                  />
                )
              })}

              {normalizedPoints.length > 0 && (
                <Path
                  d={`${chartPathData} L ${fillRightX} ${fillBottomY} L ${fillLeftX} ${fillBottomY} Z`}
                  fill={accentColor}
                  fillOpacity={0.12}
                />
              )}

              <Path
                d={chartPathData}
                stroke={accentColor}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {selectedPoint && (
                <Line
                  x1={selectedPoint.x}
                  y1={chartPaddingTop}
                  x2={selectedPoint.x}
                  y2={chartHeight - chartPaddingBottom}
                  stroke={accentColor}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  strokeDasharray={[4, 4]}
                />
              )}

              {selectedPoint && normalizedPoints[selectedPoint.index] && (
                <Circle
                  cx={selectedPoint.x}
                  cy={normalizedPoints[selectedPoint.index].y}
                  r={4}
                  fill={accentColor}
                  stroke="#000"
                  strokeWidth={1}
                />
              )}

              {normalizedPoints.length === 1 &&
                normalizedPoints.map((point, index) => (
                  <Circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill={accentColor}
                    stroke="#000"
                    strokeWidth={2}
                  />
                ))}
            </Svg>

            {selectedPoint && normalizedPoints[selectedPoint.index] && (
              <View
                style={[
                  styles.tooltip,
                  {
                    left: Math.max(4, Math.min(selectedPoint.x - 44, svgWidth - 92)),
                    top: Math.max(4, normalizedPoints[selectedPoint.index].y - 52),
                  },
                ]}
              >
                <Text style={styles.tooltipDate}>
                  {formatTooltipDate(selectedPoint.index, data.length, period, dates, isSingleDayView)}
                </Text>
                <Text style={[styles.tooltipPrice, { color: accentColor }]}>
                  {formatZar(selectedPoint.value)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </FocalBrackets>
  )
}

const getStyles = (theme: { regularFont?: string; semiBoldFont?: string; tintColor?: string }, chartHeight: number) =>
  StyleSheet.create({
    focalFrame: {
      width: '100%',
      marginTop: SPACING.xs,
    },
    chartSection: {
      width: '100%',
      paddingTop: SPACING.xs,
      overflow: 'visible',
    },
    chartWrapper: {
      flexDirection: 'row',
      width: '100%',
      alignItems: 'flex-start',
    },
    yAxisContainer: {
      width: 50,
      position: 'relative',
      paddingTop: 20,
      paddingBottom: 35,
      paddingRight: 5,
    },
    yAxisLabel: {
      fontSize: 11,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'left',
    },
    chartSvgContainer: {
      flex: 1,
      overflow: 'visible',
      position: 'relative',
    },
    tooltip: {
      position: 'absolute',
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs / 2,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      minWidth: 80,
      alignItems: 'center',
    },
    tooltipDate: {
      fontSize: 10,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 2,
    },
    tooltipPrice: {
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      fontWeight: '600',
    },
  })
