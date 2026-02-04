import { View, StyleSheet, TouchableOpacity, Dimensions, LayoutChangeEvent, PanResponder, Image } from 'react-native'
import { useContext, useState, useMemo, useRef } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import Svg, { Circle, Path, Line } from 'react-native-svg'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, STORE_COLORS } from '../../constants/layout'
import { ProgressBars } from '../store'
import { LevelRewardModal } from '../store/LevelRewardModal'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface PortfolioStats {
  cards: number
  sealed: number
  slabs: number
  total: number
}

interface GraphDataPoint {
  x: number
  y: number
}

interface ProfileHeaderProps {
  userName?: string
  isPremium?: boolean
  portfolioValue?: string
  stats?: PortfolioStats
  portfolioData?: GraphDataPoint[]
  level?: number
  currentXP?: number
  xpToNextLevel?: number
  profileImage?: any
  onEditPress?: () => void
  productsCount?: number
  followersCount?: number
  salesCount?: number
}

export function ProfileHeader({
  userName = 'Kyle',
  isPremium = true,
  portfolioValue = 'R45,000',
  stats = {
    cards: 188,
    sealed: 2,
    slabs: 0,
    total: 190,
  },
  portfolioData = [
    { x: 0, y: 42000 },
    { x: 1, y: 43500 },
    { x: 2, y: 42800 },
    { x: 3, y: 44200 },
    { x: 4, y: 44800 },
    { x: 5, y: 44500 },
    { x: 6, y: 45000 },
  ],
  level,
  currentXP,
  xpToNextLevel,
  profileImage,
  onEditPress,
  productsCount = 0,
  followersCount = 0,
  salesCount = 0,
}: ProfileHeaderProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [isHovering, setIsHovering] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('1M')
  const [chartWidth, setChartWidth] = useState(SCREEN_WIDTH - (SPACING.containerPadding * 2))
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; value: number; index: number } | null>(null)
  const chartContainerRef = useRef<View>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  // Use portfolioData prop if provided, otherwise show empty
  const chartData = useMemo(() => {
    // If portfolioData is provided and has data, use it
    if (portfolioData && portfolioData.length > 0) {
      return portfolioData
    }
    // Otherwise return empty array (will show empty state)
    return []
  }, [portfolioData])

  // Chart calculations - professional TradingView style
  const chartHeight = 200
  const yAxisWidth = 50 // Wider Y-axis labels to accommodate numbers
  const chartPaddingLeft = 15 // Padding after Y-axis labels
  const chartPaddingRight = 0 // Minimal padding - extend to edge
  const chartPaddingTop = 20
  const chartPaddingBottom = 35
  // SVG width is chartWidth minus Y-axis width
  const svgWidth = Math.max(0, chartWidth - yAxisWidth)
  // Graph width is SVG width minus left and right padding
  const graphWidth = Math.max(0, svgWidth - chartPaddingLeft - chartPaddingRight)
  const graphHeight = Math.max(0, chartHeight - chartPaddingTop - chartPaddingBottom)

  // Handle empty data
  const hasData = chartData && chartData.length > 0

  // Round to nice numbers for better Y-axis labels
  const roundToNiceNumber = (num: number, roundUp: boolean = false) => {
    if (num === 0) return 0
    const magnitude = Math.pow(10, Math.floor(Math.log10(num)))
    const normalized = num / magnitude
    let rounded
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
  
  // Calculate chart values only if we have data
  const maxValue = hasData ? Math.max(...chartData.map(d => d.y)) : 0
  const minValue = hasData ? Math.min(...chartData.map(d => d.y)) : 0
  // For single value (straight line), add padding to show it properly
  const padding = hasData ? ((maxValue === minValue ? maxValue * 0.1 : (maxValue - minValue) * 0.1) || 2000) : 0
  const chartMin = hasData ? Math.max(0, roundToNiceNumber(minValue - padding, false)) : 0
  const chartMax = hasData ? roundToNiceNumber(maxValue + padding, true) : 0
  const valueRange = chartMax - chartMin || 1

  // Generate grid lines and Y-axis labels - only if we have data
  const gridCount = 5
  const gridStep = valueRange / (gridCount - 1)
  const gridLines = hasData ? Array.from({ length: gridCount }, (_, i) => {
    const value = chartMin + gridStep * i
    const y = chartHeight - chartPaddingBottom - ((value - chartMin) / valueRange) * graphHeight
    return { y, value: Math.round(value / 1000) * 1000 } // Round to nearest 1000
  }) : []

  // Normalize chart points - coordinates relative to SVG (start after padding)
  // Handle single point (straight line) or multiple points
  const normalizedPoints = hasData ? chartData.map((point, index) => {
    const xPosition = chartData.length === 1 
      ? chartPaddingLeft + (graphWidth / 2) // Center single point
      : chartPaddingLeft + (index / (chartData.length - 1 || 1)) * graphWidth
    return {
      x: xPosition,
      y: chartHeight - chartPaddingBottom - ((point.y - chartMin) / valueRange) * graphHeight,
      value: point.y,
      index,
    }
  }) : []

  // Create SVG path
  // For single point or same values, create a horizontal line
  const chartPathData = hasData ? (() => {
    if (normalizedPoints.length === 0) return ''
    if (normalizedPoints.length === 1) {
      // Single point - create a horizontal line across the chart
      const point = normalizedPoints[0]
      return `M ${chartPaddingLeft} ${point.y} L ${chartPaddingLeft + graphWidth} ${point.y}`
    }
    // Multiple points - create path connecting them
    return normalizedPoints.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`
      }
      return `${path} L ${point.x} ${point.y}`
    }, '')
  })() : ''

  const latestValue = hasData ? (chartData[chartData.length - 1]?.y || 0) : 0
  const previousValue = hasData && chartData.length > 1 ? (chartData[chartData.length - 2]?.y || 0) : 0
  const change = latestValue - previousValue
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(1) : '0.0'

  const handleChartLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setChartWidth(width)
  }

  // Format date based on period and index
  // Check if all values are the same (single-day view)
  const isSingleDayView = hasData && chartData.length > 0 && chartData.every((point, _, arr) => point.y === arr[0].y)
  
  const formatDate = (index: number, total: number, period: '1M' | '3M' | '6M' | '1Y') => {
    // If it's a single-day view (all same values), always show "Today"
    if (isSingleDayView) {
      return 'Today'
    }
    
    const now = new Date()
    let date = new Date(now)
    
    if (period === '1M') {
      date.setDate(now.getDate() - (total - 1 - index))
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (period === '3M') {
      date.setDate(now.getDate() - (90 - Math.floor((90 / (total - 1)) * index)))
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (period === '6M') {
      date.setDate(now.getDate() - (180 - Math.floor((180 / (total - 1)) * index)))
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      date.setDate(now.getDate() - (365 - Math.floor((365 / (total - 1)) * index)))
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.locationX)
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        // Keep showing the last touched point
      },
    })
  ).current

  const handleTouch = (x: number) => {
    if (!hasData) {
      setSelectedPoint(null)
      return
    }
    const chartX = x - yAxisWidth - chartPaddingLeft
    if (chartX < 0 || chartX > graphWidth) {
      setSelectedPoint(null)
      return
    }

    const closestPoint = normalizedPoints.reduce((prev, curr, index) => {
      const prevDist = Math.abs(prev.x - chartX)
      const currDist = Math.abs(curr.x - chartX)
      return currDist < prevDist ? { ...curr, index } : { ...prev, index: prev.index }
    }, { ...normalizedPoints[0], index: 0 })

    setSelectedPoint({
      x: closestPoint.x,
      value: closestPoint.value,
      index: closestPoint.index,
    })
  }

  const initials = userName
    ? userName
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    : 'U'

  // Get the reward for the next level
  const getNextLevelReward = (currentLevel: number) => {
    const nextLevel = currentLevel + 1
    
    // Level 4 = Gold, Level 5 = Platinum, Level 6 = Diamond
    if (nextLevel === 4) {
      return { icon: 'radio-button-on-outline' as const, color: STORE_COLORS.gold, label: 'Gold Ring' }
    } else if (nextLevel === 5) {
      return { icon: 'radio-button-on-outline' as const, color: STORE_COLORS.platinum, label: 'Platinum Ring' }
    } else if (nextLevel === 6) {
      return { icon: 'diamond' as const, color: STORE_COLORS.diamond, label: 'Diamond Ring' }
    }
    return null
  }

  // Get the ring color based on current level
  const getRingColor = () => {
    if (level === undefined) return null
    if (level >= 9) return '#E74C3C' // Red (Supreme)
    if (level >= 8) return '#E67E22' // Orange (Legendary)
    if (level >= 7) return '#9B59B6' // Purple (Master)
    if (level >= 6) return STORE_COLORS.diamond // Diamond
    if (level >= 5) return STORE_COLORS.platinum // Platinum
    if (level >= 4) return STORE_COLORS.gold // Gold
    if (level >= 3) return STORE_COLORS.silver // Silver
    return null
  }

  const nextReward = level !== undefined ? getNextLevelReward(level) : null
  const ringColor = getRingColor()

  const handleLevelPress = (lvl: number) => {
    setSelectedLevel(lvl)
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      {/* Integrated Header with Stats */}
      <View style={styles.headerSection}>
        {/* Profile Picture and Stats */}
        <View style={styles.profilePictureContainer}>
          {/* Profile Picture and Name Row */}
          <View style={styles.profileAndNameRow}>
            <View style={styles.profileIconWrapper}>
              <TouchableOpacity
                style={styles.profileIcon}
                activeOpacity={0.8}
                onPress={onEditPress}
                onPressIn={() => setIsHovering(true)}
                onPressOut={() => setIsHovering(false)}
              >
                {profileImage ? (
                  <Image
                    source={profileImage}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.profileInitials}>{initials}</Text>
                )}
                {isHovering && (
                  <View style={styles.editIconContainer}>
                    <Ionicons
                      name="pencil"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </TouchableOpacity>
              {/* Level Ring - Silver for Level 3 */}
              {ringColor && (
                <>
                  <View style={[styles.ringOuter, { borderColor: ringColor }]} />
                  <View style={[styles.ringInner, { borderColor: ringColor }]} />
                </>
              )}
              <View style={styles.trustedBadge}>
                <View style={styles.shieldIconContainer}>
                  <Ionicons name="shield-outline" size={12} color={theme.tintColor || '#73EC8B'} style={styles.shieldIcon} />
                  <Ionicons name="checkmark" size={8} color="rgba(0, 0, 0, 0.6)" style={styles.checkmarkIcon} />
                </View>
                <Text style={styles.trustedText}>Trusted</Text>
              </View>
            </View>

            {/* User Name and Premium */}
            <View style={styles.userNameContainer}>
              <View style={styles.userNameRow}>
                <Text style={styles.userNameLarge}>{userName}</Text>
                {isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
              </View>
              {level !== undefined && (
                <TouchableOpacity
                  style={styles.levelBadge}
                  onPress={() => handleLevelPress(level)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.levelText}>Lv {level}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stats Section - Below Profile Picture */}
          <View style={styles.statsSection}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNumber}>
                {productsCount >= 1000 ? `${(productsCount / 1000).toFixed(1)}K` : productsCount}
              </Text>
              <Text style={styles.profileStatLabel}> Products</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNumber}>
                {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : followersCount}
              </Text>
              <Text style={styles.profileStatLabel}> Followers</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNumber}>
                {salesCount >= 1000 ? `${(salesCount / 1000).toFixed(1)}K` : salesCount}
              </Text>
              <Text style={styles.profileStatLabel}> Sales</Text>
            </View>
          </View>
        </View>

        {/* Level Progress Bar */}
        {level !== undefined && currentXP !== undefined && xpToNextLevel !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.levelBadgesRow}>
              {nextReward && (
                <TouchableOpacity
                  style={styles.nextLevelBadge}
                  activeOpacity={0.7}
                  onPress={() => handleLevelPress(level! + 1)}
                >
                  <Ionicons
                    name={nextReward.icon}
                    size={14}
                    color={nextReward.color}
                    style={styles.rewardIcon}
                  />
                  <Text style={[styles.rewardText, { color: nextReward.color }]}>
                    Lv {level! + 1}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ProgressBars
              level={level}
              currentXP={currentXP}
              xpToNextLevel={xpToNextLevel}
              showVertical={false}
              profileImage={profileImage}
              showNextLevelBadge={false}
            />
          </View>
        )}

        {/* Portfolio Value - Prominent */}
        <View style={styles.portfolioValueSection}>
          <Text style={styles.portfolioLabel}>Portfolio Value</Text>
          <View style={styles.portfolioValueRow}>
            <Text style={styles.portfolioValue}>{portfolioValue}</Text>
            {change !== 0 && (
              <View style={[styles.changeBadge, change >= 0 ? styles.changePositive : styles.changeNegative]}>
                <Ionicons
                  name={change >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={10}
                  color={change >= 0 ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.changeText, change >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                  {Math.abs(parseFloat(changePercent))}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Portfolio Growth Chart - Professional TradingView style */}
        {hasData && chartPathData ? (
          <View style={styles.chartSection} onLayout={handleChartLayout}>
            <View style={styles.chartWrapper}>
              {/* Y-axis labels - highest at top */}
              <View style={styles.yAxisContainer}>
                {[...gridLines].reverse().map((grid, index) => (
                  <Text 
                    key={index} 
                    style={[
                      styles.yAxisLabel, 
                      { 
                        position: 'absolute',
                        top: grid.y - 6,
                      }
                    ]}
                  >
                    R{grid.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </Text>
                ))}
              </View>

              {/* Chart SVG - Professional financial chart style */}
              <View 
                style={styles.chartSvgContainer}
                ref={chartContainerRef}
                {...panResponder.panHandlers}
              >
                <Svg width={svgWidth} height={chartHeight}>
                  {/* Grid lines - professional and visible */}
                  {gridLines.map((grid, index) => {
                    const isBottomLine = index === 0
                    return (
                      <Line
                        key={index}
                        x1={chartPaddingLeft}
                        y1={grid.y}
                        x2={chartPaddingLeft + graphWidth}
                        y2={grid.y}
                        stroke={isBottomLine ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}
                        strokeWidth={1}
                      />
                    )
                  })}

                  {/* Filled area - subtle gradient */}
                  {normalizedPoints.length > 0 && (
                    <Path
                      d={`${chartPathData} L ${normalizedPoints[normalizedPoints.length - 1].x} ${chartHeight - chartPaddingBottom} L ${normalizedPoints[0].x} ${chartHeight - chartPaddingBottom} Z`}
                      fill={theme.tintColor || '#73EC8B'}
                      fillOpacity={0.1}
                    />
                  )}

                  {/* Main chart line - sharp and professional */}
                  <Path
                    d={chartPathData}
                    stroke={theme.tintColor || '#73EC8B'}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Vertical crosshair line when touching */}
                  {selectedPoint && (
                    <Line
                      x1={selectedPoint.x}
                      y1={chartPaddingTop}
                      x2={selectedPoint.x}
                      y2={chartHeight - chartPaddingBottom}
                      stroke={theme.tintColor || '#73EC8B'}
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      strokeDasharray="4,4"
                    />
                  )}

                  {/* Data point circle when touching */}
                  {selectedPoint && normalizedPoints[selectedPoint.index] && (
                    <Circle
                      cx={selectedPoint.x}
                      cy={normalizedPoints[selectedPoint.index].y}
                      r={4}
                      fill={theme.tintColor || '#73EC8B'}
                      stroke="#000"
                      strokeWidth={1}
                    />
                  )}
                  
                  {/* Show data points for single-day view (single point) */}
                  {normalizedPoints.length === 1 && normalizedPoints.map((point, index) => (
                    <Circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r={5}
                      fill={theme.tintColor || '#73EC8B'}
                      stroke="#000"
                      strokeWidth={2}
                    />
                  ))}
                </Svg>

                {/* Tooltip - positioned at top left of chart */}
                {selectedPoint && (
                  <View style={[styles.tooltip, { left: Math.max(0, Math.min(selectedPoint.x - 40, svgWidth - 100)) }]}>
                    <Text style={styles.tooltipDate}>
                      {formatDate(selectedPoint.index, chartData.length, selectedPeriod)}
                    </Text>
                    <Text style={styles.tooltipPrice}>
                      R{selectedPoint.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.chartSection}>
            <View style={styles.emptyChartContainer}>
              <Ionicons name="trending-up-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyChartText}>No portfolio data yet</Text>
              <Text style={styles.emptyChartSubtext}>
                Add items to your collection to track portfolio growth
              </Text>
            </View>
          </View>
        )}

        {/* Time Period Filters - Only show if we have historical data (more than just current value) */}
        {hasData && chartData.length > 7 && (
          <View style={styles.periodSelectorContainer}>
            <View style={styles.periodSelector}>
              {(['1M', '3M', '6M', '1Y'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodOption,
                    selectedPeriod === period && styles.periodOptionActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      selectedPeriod === period && styles.periodOptionTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </View>

      {/* Level Reward Modal */}
      <LevelRewardModal
        visible={modalVisible}
        level={selectedLevel || (level !== undefined ? level + 1 : 4)}
        userCurrentLevel={level}
        profileImage={profileImage}
        onClose={() => {
          setModalVisible(false)
          setSelectedLevel(null)
        }}
      />
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  headerSection: {
    backgroundColor: theme.backgroundColor,
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.containerPadding,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  profilePictureContainer: {
    marginBottom: SPACING.sm,
  },
  profileAndNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  profileStatNumber: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '700',
  },
  profileStatLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statSeparator: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: SPACING.xs,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginRight: SPACING.sm,
    letterSpacing: -0.2,
  },
  premiumBadge: {
    backgroundColor: theme.buttonBackground || 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  premiumText: {
    color: theme.textColor,
    fontFamily: theme.semiBoldFont,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  profileIconWrapper: {
    position: 'relative',
    width: 108,
    height: 108,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: theme.textColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 2,
  },
  ringOuter: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    opacity: 0.8,
    zIndex: 1,
  },
  ringInner: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    opacity: 0.6,
    zIndex: 1,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    color: theme.backgroundColor,
    fontFamily: theme.boldFont,
    fontSize: TYPOGRAPHY.h2,
    fontWeight: '600',
  },
  trustedBadge: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -35 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
    zIndex: 3,
  },
  shieldIconContainer: {
    position: 'relative',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    position: 'absolute',
  },
  checkmarkIcon: {
    position: 'absolute',
  },
  trustedText: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  editIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  levelBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    width: '100%',
  },
  levelBadge: {
    backgroundColor: theme.tintColor || '#73EC8B',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  },
  nextLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rewardIcon: {
    marginRight: 4,
  },
  rewardText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
  },
  levelText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.boldFont,
    color: '#000000',
    fontWeight: '600',
  },
  portfolioValueSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  portfolioValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs / 2,
  },
  portfolioLabel: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: SPACING.sm,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  portfolioValue: {
    fontSize: TYPOGRAPHY.h1 * 1.5,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  periodSelectorContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
    marginTop: -SPACING['2xl'],
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  periodOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodOptionActive: {
    backgroundColor: theme.textColor,
  },
  periodOptionText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  periodOptionTextActive: {
    color: theme.backgroundColor,
  },
  chartSection: {
    width: '100%',
    marginBottom: 0,
    paddingVertical: SPACING.sm,
    paddingBottom: 0,
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
    paddingLeft: 0,
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
    height: 200,
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
  tooltipPrice: {
    fontSize: 12,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    gap: 2,
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
  },
  changeTextPositive: {
    color: '#10B981',
  },
  changeTextNegative: {
    color: '#EF4444',
  },
  statsPillContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.2,
  },
  userNameContainer: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  userNameLarge: {
    fontSize: TYPOGRAPHY.h1 * 1.2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '700',
    marginTop: -SPACING.xs,
    letterSpacing: -0.3,
  },
  emptyChartContainer: {
    padding: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyChartText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyChartSubtext: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
})
