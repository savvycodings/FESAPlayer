import { useState } from 'react'
import { View, StyleSheet, LayoutChangeEvent } from 'react-native'
import { useContext } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface GraphDataPoint {
  x: number
  y: number
}

interface PortfolioGraphProps {
  data: GraphDataPoint[]
  height?: number
  color?: string
  title?: string
  subtitle?: string
}

export function PortfolioGraph({
  data,
  height = 140,
  color = '#FFFFFF',
  title = 'Portfolio Growth',
  subtitle = 'Last 7 days',
}: PortfolioGraphProps) {
  const { theme } = useContext(ThemeContext)
  const [width, setWidth] = useState(300)
  const styles = getStyles(theme)
  const padding = SPACING.lg

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: layoutWidth } = event.nativeEvent.layout
    setWidth(layoutWidth)
  }

  if (!data || data.length === 0) {
    return (
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        </CardContent>
      </Card>
    )
  }

  const graphWidth = Math.max(0, width - padding * 2)
  const graphHeight = Math.max(0, height - padding * 2)
  const maxValue = Math.max(...data.map(d => d.y))
  const minValue = Math.min(...data.map(d => d.y))
  const valueRange = maxValue - minValue || 1

  // Normalize data points to graph coordinates
  const normalizedPoints = data.map((point, index) => ({
    x: padding + (index / (data.length - 1 || 1)) * graphWidth,
    y: height - padding - ((point.y - minValue) / valueRange) * graphHeight,
    value: point.y,
  }))

  // Create SVG path for the line
  const pathData = normalizedPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')

  const latestValue = data[data.length - 1]?.y || 0
  const previousValue = data[data.length - 2]?.y || 0
  const change = latestValue - previousValue
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(1) : '0.0'

  return (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="trending-up-outline" size={20} color={color} />
            </View>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.value}>${latestValue}</Text>
            <View style={[styles.changeContainer, change >= 0 ? styles.changePositive : styles.changeNegative]}>
              <Ionicons
                name={change >= 0 ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={change >= 0 ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.changeText, change >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                {Math.abs(parseFloat(changePercent))}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.graphContainer} onLayout={handleLayout}>
          {width > padding * 2 && graphWidth > 0 && (
            <Svg width={width} height={height} style={styles.svg}>
              {/* Filled area under graph */}
              <Path
                d={`${pathData} L ${normalizedPoints[normalizedPoints.length - 1].x} ${height - padding} L ${normalizedPoints[0].x} ${height - padding} Z`}
                fill={color}
                fillOpacity={0.15}
              />
              {/* Graph line */}
              <Path
                d={pathData}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {normalizedPoints.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={5}
                  fill={color}
                  stroke="#0F0E0E"
                  strokeWidth={2}
                />
              ))}
            </Svg>
          )}
        </View>
      </CardContent>
    </Card>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
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
    marginBottom: SPACING.xs / 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  changePositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  changeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  changeText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
    marginLeft: 2,
  },
  changeTextPositive: {
    color: '#10B981',
  },
  changeTextNegative: {
    color: '#EF4444',
  },
  graphContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    width: '100%',
  },
  emptyContainer: {
    padding: SPACING['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
})
