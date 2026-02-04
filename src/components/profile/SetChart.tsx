import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface SetData {
  label: string
  value: number
}

interface SetChartProps {
  data: SetData[]
  maxHeight?: number
  barColor?: string
}

export function SetChart({
  data,
  maxHeight = 140,
  barColor = '#FFFFFF',
}: SetChartProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, maxHeight)

  const maxValue = Math.max(...data.map(d => d.value))
  const totalCards = data.reduce((sum, set) => sum + set.value, 0)

  return (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="pie-chart-outline" size={20} color={barColor} />
            </View>
            <View>
              <Text style={styles.title}>Set Distribution</Text>
              <Text style={styles.subtitle}>{totalCards} total cards</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {data.map((set, index) => {
              const barHeight = (set.value / maxValue) * maxHeight
              const percentage = ((set.value / totalCards) * 100).toFixed(0)
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
                      <Text style={styles.barValue}>{set.value}</Text>
                    </View>
                  </View>
                  <View style={styles.barInfo}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {set.label}
                    </Text>
                    <Text style={styles.barPercentage}>{percentage}%</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </CardContent>
    </Card>
  )
}

const getStyles = (theme: any, maxHeight: number) => StyleSheet.create({
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
  chartContainer: {
    width: '100%',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: maxHeight + SPACING['2xl'],
    paddingBottom: SPACING.md,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: SPACING.xs / 2,
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  bar: {
    width: '100%',
    borderRadius: RADIUS.sm,
    minHeight: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.xs / 2,
  },
  barValue: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.boldFont,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  barInfo: {
    width: '100%',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    textAlign: 'center',
    marginBottom: SPACING.xs / 2,
  },
  barPercentage: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
})
