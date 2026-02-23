import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface StoreStatsProps {
  totalSales: number
  totalRevenue: number
  responseTime?: string
  reviewPercentage?: number
}

export function StoreStats({
  totalSales,
  totalRevenue,
  responseTime = 'N/A',
  reviewPercentage = 100,
}: StoreStatsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.statsWrapper}>
      <View style={styles.statBlock}>
        <Text style={styles.statValue}>{totalSales}</Text>
        <Text style={styles.statLabel}>Sales</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBlock}>
        <Text style={styles.revenueValue}>${totalRevenue}</Text>
        <Text style={styles.statLabel}>Revenue</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBlock}>
        <Text style={styles.statValue}>{responseTime}</Text>
        <Text style={styles.statLabel}>Response</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBlock}>
        <Text style={styles.statValue}>{reviewPercentage}%</Text>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  statsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 0,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  revenueValue: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
    marginBottom: 2,
  },
})
