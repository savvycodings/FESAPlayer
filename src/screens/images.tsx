import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import Svg, { Circle, Path } from 'react-native-svg'

const { width } = Dimensions.get('window')

export function Images() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  // Sample data for goal section
  const stats = {
    cards: 188,
    sealed: 2,
    slabs: 0,
    total: 190,
  }

  const goal = 200
  const progress = (stats.total / goal) * 100
  const circumference = 2 * Math.PI * 86 // radius = 86 (180/2 - 8 for border)
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Bar chart data
  const setData = [
    { label: 'SET 1', value: 5 },
    { label: 'SET 2', value: 35 },
    { label: 'SET 3', value: 25 },
    { label: 'SET 4', value: 10 },
    { label: 'SET 5', value: 60 },
    { label: 'SET 6', value: 40 },
    { label: 'SET 7', value: 50 },
  ]

  const maxValue = Math.max(...setData.map(d => d.value))

  // Graph data points (random portfolio values over time)
  const graphData = [
    { x: 0, y: 45 },
    { x: 1, y: 52 },
    { x: 2, y: 48 },
    { x: 3, y: 55 },
    { x: 4, y: 62 },
    { x: 5, y: 58 },
    { x: 6, y: 67 },
  ]

  // Calculate graph dimensions
  const graphWidth = width - 80 // Account for container padding (20px each side) and graph padding
  const graphHeight = 120
  const padding = 20
  const maxGraphValue = Math.max(...graphData.map(d => d.y))
  const minGraphValue = Math.min(...graphData.map(d => d.y))
  const valueRange = maxGraphValue - minGraphValue || 1

  // Normalize data points to graph coordinates
  const normalizedPoints = graphData.map(point => ({
    x: padding + (point.x / (graphData.length - 1)) * (graphWidth - padding * 2),
    y: graphHeight - padding - ((point.y - minGraphValue) / valueRange) * (graphHeight - padding * 2),
    value: point.y,
  }))

  // Create SVG path for the line
  const pathData = normalizedPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')

  // Generate 6 product items for the grid
  const productItems = Array.from({ length: 6 }, (_, i) => i)

  return (
    <View style={styles.container}>
      {/* Search Bar - Fixed at top */}
      <View style={styles.topSearchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#FFFFFF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchText}
            placeholder="Search"
            placeholderTextColor="#FFFFFF"
            underlineColorAndroid="transparent"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Portfolio Summary */}
        <View style={styles.portfolioSummary}>
          <Text style={styles.portfolioLabel}>PORTFOLIO</Text>
          <Text style={styles.portfolioValue}>$67</Text>
          
          {/* Summary Statistics */}
          <View style={styles.statsPillContainer}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>CARDS</Text>
                <Text style={styles.statValue}>{stats.cards}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SEALED</Text>
                <Text style={styles.statValue}>{stats.sealed}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SLABS</Text>
                <Text style={styles.statValue}>{stats.slabs}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TOTAL</Text>
                <Text style={styles.statValue}>{stats.total}</Text>
              </View>
            </View>
          </View>
          
          {/* Graph */}
          <View style={styles.graphContainer}>
            <Svg width={graphWidth} height={graphHeight} style={styles.graphSvg}>
              {/* Filled area under graph */}
              <Path
                d={`${pathData} L ${normalizedPoints[normalizedPoints.length - 1].x} ${graphHeight - padding} L ${normalizedPoints[0].x} ${graphHeight - padding} Z`}
                fill={theme.tintColor || '#73EC8B'}
                fillOpacity={0.2}
              />
              {/* Graph line */}
              <Path
                d={pathData}
                stroke={theme.tintColor || '#73EC8B'}
                strokeWidth={2}
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
                  r={4}
                  fill={theme.tintColor || '#73EC8B'}
                />
              ))}
            </Svg>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtonWrapper}>
            <TouchableHighlight
              underlayColor={'transparent'}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonCircle}>
                <Ionicons
                  name="add"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </TouchableHighlight>
            <Text style={styles.actionButtonLabel}>Movers</Text>
          </View>
          
          <View style={styles.actionButtonWrapper}>
            <TouchableHighlight
              underlayColor={'transparent'}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonCircle}>
                <Ionicons
                  name="add"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </TouchableHighlight>
            <Text style={styles.actionButtonLabel}>PORTFOLIO</Text>
          </View>
          
          <View style={styles.actionButtonWrapper}>
            <TouchableHighlight
              underlayColor={'transparent'}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonCircle}>
                <Ionicons
                  name="add"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </TouchableHighlight>
            <Text style={styles.actionButtonLabel}>Export</Text>
          </View>
        </View>

        {/* Product Grid */}
        <View style={styles.productGrid}>
          {productItems.map((item) => (
            <View key={item} style={styles.productCard}>
              <View style={styles.productPlaceholder}>
                <Ionicons
                  name="close"
                  size={32}
                  color={theme.textColor}
                />
              </View>
              <Text style={styles.productPrice}>$ 67</Text>
              <Text style={styles.productName}>Product name #3</Text>
            </View>
          ))}
        </View>

        {/* Goal and Progress Circle */}
        <View style={styles.progressSection}>
          <Text style={styles.goalText}>GOAL: {goal}</Text>
          <View style={styles.progressCircleContainer}>
            <Svg width={200} height={200} style={styles.progressSvg}>
              {/* Background circle */}
              <Circle
                cx="100"
                cy="100"
                r="86"
                stroke="#000000"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress arc */}
              <Circle
                cx="100"
                cy="100"
                r="86"
                stroke={theme.tintColor || '#73EC8B'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </Svg>
            <View style={styles.progressCircleInner}>
              <Text style={styles.progressNumber}>{stats.total}</Text>
              <Text style={styles.progressLabel}>Total Cards</Text>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {setData.map((set, index) => {
              const barHeight = (set.value / maxValue) * 120
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: barHeight }]} />
                  <Text style={styles.barLabel}>{set.label}</Text>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 40,
  },
  topSearchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: theme.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchText: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: theme.regularFont,
    fontSize: 16,
    marginLeft: 5,
    ...(Platform.OS === 'web' ? {
      outline: 'none',
      outlineWidth: 0,
      outlineStyle: 'none',
    } : {}),
  },
  portfolioSummary: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  portfolioLabel: {
    fontSize: 14,
    fontFamily: theme.mediumFont,
    color: theme.textColor,
    letterSpacing: 1,
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 48,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: 20,
  },
  statsPillContainer: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.mediumFont,
    color: theme.textColor,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: theme.boldFont,
    color: theme.textColor,
  },
  graphContainer: {
    width: '100%',
    height: 150,
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphSvg: {
    width: '100%',
    height: 120,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  actionButtonWrapper: {
    alignItems: 'center',
  },
  actionButton: {
    marginBottom: 8,
  },
  actionButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonLabel: {
    fontSize: 12,
    fontFamily: theme.mediumFont,
    color: theme.textColor,
    marginTop: 4,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '31%',
    marginBottom: 20,
  },
  productPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: theme.textColor,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: 4,
  },
  productName: {
    fontSize: 12,
    fontFamily: theme.regularFont,
    color: theme.textColor,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  goalText: {
    fontSize: 16,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: 20,
  },
  progressCircleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressSvg: {
    position: 'absolute',
  },
  progressCircleInner: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 48,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: theme.regularFont,
    color: theme.textColor,
  },
  chartContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: 30,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  bar: {
    width: '80%',
    backgroundColor: theme.tintColor || '#73EC8B',
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    textAlign: 'center',
  },
})
