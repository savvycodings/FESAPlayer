import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'

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
    <View style={styles.statsRow}>
      <Text style={styles.statInline}>
        <Text style={styles.statNum}>{totalSales}</Text>
        <Text style={styles.statLabel}> Sales</Text>
      </Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.statInline}>
        <Text style={styles.statNum}>R{Number(totalRevenue).toLocaleString('en-ZA')}</Text>
        <Text style={styles.statLabel}> Rev</Text>
      </Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.statInline}>
        <Text style={styles.statNum}>{responseTime}</Text>
        <Text style={styles.statLabel}> Resp</Text>
      </Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.statInline}>
        <Text style={styles.statNum}>{reviewPercentage}%</Text>
        <Text style={styles.statLabel}> Rating</Text>
      </Text>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNum: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  dot: {
    fontSize: TYPOGRAPHY.label,
    color: 'rgba(255, 255, 255, 0.2)',
  },
})
