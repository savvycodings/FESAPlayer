import { useState, useRef, useMemo, useContext } from 'react'
import { View, StyleSheet, LayoutChangeEvent, PanResponder } from 'react-native'
import Svg, { Circle, Path, Line } from 'react-native-svg'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export interface GraphDataPoint {
  x: number
  y: number
}

export interface PriceChartProps {
  data: GraphDataPoint[]
  dates?: string[]
  title?: string
  subtitle?: string
  valuePrefix?: string
  color?: string
  height?: number
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

function formatDisplayDate(dateStr: string | undefined, index: number, total: number): string {
  if (dateStr) {
    try {
      const d = new Date(dateStr)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    } catch (_) {}
  }
  if (total <= 1) return 'Today'
  return `Day ${index + 1}`
}

export function PriceChart({
  data,
  dates,
  title = 'Price',
  subtitle = '',
  valuePrefix = 'R',
  color,
  height = 200,
}: PriceChartProps) {
  const { theme } = useContext(ThemeContext)
  const chartColor = color ?? theme.tintColor ?? '#73EC8B'
  const styles = getStyles(theme, chartColor)

  const [chartWidth, setChartWidth] = useState(280)
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; value: number; index: number } | null>(null)
  const chartContainerRef = useRef<View>(null)

  const chartHeight = height
  const yAxisWidth = 50
  const chartPaddingLeft = 15
  const chartPaddingRight = 0
  const chartPaddingTop = 20
  const chartPaddingBottom = 35
  const svgWidth = Math.max(0, chartWidth - yAxisWidth)
  const graphWidth = Math.max(0, svgWidth - chartPaddingLeft - chartPaddingRight)
  const graphHeight = Math.max(0, chartHeight - chartPaddingTop - chartPaddingBottom)

  const hasData = data && data.length > 0

  const { chartMin, chartMax, valueRange, gridLines, normalizedPoints, chartPathData } = useMemo(() => {
    if (!hasData) {
      const emptyGrid = [
        { y: chartPaddingTop, value: 0 },
        { y: chartHeight - chartPaddingBottom, value: 0 },
      ]
      return { chartMin: 0, chartMax: 0, valueRange: 1, gridLines: emptyGrid, normalizedPoints: [] as { x: number; y: number; value: number; index: number }[], chartPathData: '' }
    }
    const maxValue = Math.max(...data.map(d => d.y))
    const minValue = Math.min(...data.map(d => d.y))
    const padding = maxValue === minValue ? maxValue * 0.1 : (maxValue - minValue) * 0.1
    const cMin = Math.max(0, roundToNiceNumber(minValue - padding, false))
    const cMax = roundToNiceNumber(maxValue + padding, true)
    const range = cMax - cMin || 1

    const gridCount = 5
    const gridStep = range / (gridCount - 1)
    const grid = Array.from({ length: gridCount }, (_, i) => {
      const value = cMin + gridStep * i
      const y = chartHeight - chartPaddingBottom - ((value - cMin) / range) * graphHeight
      return { y, value: Math.round(value / 100) * 100 }
    })

    const points = data.map((point, index) => {
      const xPosition = data.length === 1
        ? chartPaddingLeft + graphWidth / 2
        : chartPaddingLeft + (index / (data.length - 1 || 1)) * graphWidth
      return {
        x: xPosition,
        y: chartHeight - chartPaddingBottom - ((point.y - cMin) / range) * graphHeight,
        value: point.y,
        index,
      }
    })

    let path = ''
    if (points.length === 1) {
      path = `M ${chartPaddingLeft} ${points[0].y} L ${chartPaddingLeft + graphWidth} ${points[0].y}`
    } else if (points.length > 1) {
      path = points.reduce((p, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`
        return `${p} L ${point.x} ${point.y}`
      }, '')
    }

    return { chartMin: cMin, chartMax: cMax, valueRange: range, gridLines: grid, normalizedPoints: points, chartPathData: path }
  }, [data, hasData, chartHeight, chartPaddingBottom, graphWidth, graphHeight, chartPaddingLeft])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
      onPanResponderRelease: () => {},
    })
  ).current

  const handleTouch = (x: number) => {
    if (!hasData || normalizedPoints.length === 0) {
      setSelectedPoint(null)
      return
    }
    const chartX = x - yAxisWidth - chartPaddingLeft
    if (chartX < 0 || chartX > graphWidth) {
      setSelectedPoint(null)
      return
    }
    const closest = normalizedPoints.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.x - chartX)
      const currDist = Math.abs(curr.x - chartX)
      return currDist < prevDist ? curr : prev
    }, normalizedPoints[0])
    setSelectedPoint({ x: closest.x, value: closest.value, index: closest.index })
  }

  const handleChartLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout
    setChartWidth(width)
  }

  const latestValue = hasData ? (data[data.length - 1]?.y ?? 0) : 0
  const previousValue = hasData && data.length > 1 ? (data[data.length - 2]?.y ?? 0) : 0
  const change = latestValue - previousValue
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(1) : '—'

  return (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="trending-up-outline" size={20} color={chartColor} />
            </View>
            <View>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.value}>
              {hasData
                ? `${valuePrefix}${latestValue.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : '—'}
            </Text>
            {hasData && changePercent !== '—' && (
              <View style={[styles.changeContainer, change >= 0 ? styles.changePositive : styles.changeNegative]}>
                <Ionicons name={change >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={change >= 0 ? '#10B981' : '#EF4444'} />
                <Text style={[styles.changeText, change >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                  {Math.abs(parseFloat(changePercent))}%
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.chartSection} onLayout={handleChartLayout}>
          <View style={styles.chartWrapper}>
            <View style={[styles.yAxisContainer, { height: chartHeight }]}>
              {[...gridLines].reverse().map((grid, i) => (
                <Text key={i} style={[styles.yAxisLabel, { position: 'absolute', top: grid.y - 6 }]}>
                  {valuePrefix}{grid.value.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                </Text>
              ))}
            </View>
            <View style={[styles.chartSvgContainer, { height: chartHeight }]} ref={chartContainerRef} {...panResponder.panHandlers}>
              <Svg width={svgWidth} height={chartHeight}>
                {gridLines.map((grid, i) => (
                  <Line
                    key={i}
                    x1={chartPaddingLeft}
                    y1={grid.y}
                    x2={chartPaddingLeft + graphWidth}
                    y2={grid.y}
                    stroke={i === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}
                    strokeWidth={1}
                  />
                ))}
                {normalizedPoints.length > 0 && chartPathData && (
                  <Path
                    d={`${chartPathData} L ${normalizedPoints[normalizedPoints.length - 1].x} ${chartHeight - chartPaddingBottom} L ${normalizedPoints[0].x} ${chartHeight - chartPaddingBottom} Z`}
                    fill={chartColor}
                    fillOpacity={0.1}
                  />
                )}
                <Path d={chartPathData} stroke={chartColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {selectedPoint && (
                  <Line
                    x1={selectedPoint.x}
                    y1={chartPaddingTop}
                    x2={selectedPoint.x}
                    y2={chartHeight - chartPaddingBottom}
                    stroke={chartColor}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                    strokeDasharray="4,4"
                  />
                )}
                {selectedPoint && normalizedPoints[selectedPoint.index] && (
                  <Circle cx={selectedPoint.x} cy={normalizedPoints[selectedPoint.index].y} r={4} fill={chartColor} stroke="#000" strokeWidth={1} />
                )}
                {normalizedPoints.length === 1 && normalizedPoints.map((point, i) => (
                  <Circle key={i} cx={point.x} cy={point.y} r={5} fill={chartColor} stroke="#000" strokeWidth={2} />
                ))}
              </Svg>
              {selectedPoint && (
                <View style={[styles.tooltip, { left: Math.max(0, Math.min(selectedPoint.x - 40, svgWidth - 100)) }]}>
                  <Text style={styles.tooltipDate}>
                    {formatDisplayDate(dates?.[selectedPoint.index], selectedPoint.index, data.length)}
                  </Text>
                  <Text style={[styles.tooltipPrice, { color: chartColor }]}>
                    {valuePrefix}{selectedPoint.value.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  )
}

const getStyles = (theme: any, chartColor: string) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      marginBottom: SPACING.md,
    },
    cardContent: {
      padding: SPACING.cardPadding,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.md,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.sm,
    },
    title: {
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    headerRight: { alignItems: 'flex-end' },
    value: {
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: 2,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xs / 2,
      borderRadius: RADIUS.sm,
      gap: 2,
    },
    changePositive: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    changeNegative: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
    changeText: { fontSize: TYPOGRAPHY.caption, fontFamily: theme.semiBoldFont, fontWeight: '600' },
    changeTextPositive: { color: '#10B981' },
    changeTextNegative: { color: '#EF4444' },
    chartSection: { width: '100%', paddingVertical: SPACING.sm },
    chartWrapper: { flexDirection: 'row', width: '100%', alignItems: 'flex-start' },
    yAxisContainer: {
      width: 50,
      position: 'relative',
      paddingTop: 20,
      paddingBottom: 35,
      paddingRight: 5,
      height: 200,
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
      top: -10,
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
    tooltipPrice: { fontSize: 12, fontFamily: theme.semiBoldFont, fontWeight: '600' },
    emptyContainer: { padding: SPACING['2xl'], alignItems: 'center' },
    emptyText: { fontSize: TYPOGRAPHY.body, fontFamily: theme.regularFont, color: 'rgba(255, 255, 255, 0.5)' },
  })
