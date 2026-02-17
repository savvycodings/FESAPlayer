import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import Ionicons from '@expo/vector-icons/Ionicons'

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
    <View style={styles.statsGrid}>
      <Card style={styles.statCard}>
        <CardContent style={styles.statContent}>
          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Ionicons name="cube-outline" size={20} color={theme.textColor} style={styles.statIcon} />
              <Text style={styles.statValue}>{totalSales}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>Total Sales</Text>
          </View>
        </CardContent>
      </Card>
      <Card style={styles.statCard}>
        <CardContent style={styles.statContent}>
          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Ionicons name="cash-outline" size={20} color={theme.tintColor || '#73EC8B'} style={styles.statIcon} />
              <Text style={styles.revenueValue}>${totalRevenue}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>Revenue</Text>
          </View>
        </CardContent>
      </Card>
      <Card style={styles.statCard}>
        <CardContent style={styles.statContent}>
          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Ionicons name="time-outline" size={20} color={theme.textColor} style={styles.statIcon} />
              <Text style={styles.statValue}>{responseTime}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>Response</Text>
          </View>
        </CardContent>
      </Card>
      <Card style={styles.statCard}>
        <CardContent style={styles.statContent}>
          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Ionicons name="star-outline" size={20} color={theme.textColor} style={styles.statIcon} />
              <Text style={styles.statValue}>{reviewPercentage}%</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>Rating</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: -SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '48%',
    minWidth: 0,
  },
  statContent: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  statItem: {
    width: '100%',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  statIcon: {
    marginRight: 0,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  revenueValue: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
})
