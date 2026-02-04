import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface PortfolioStats {
  cards: number
  sealed: number
  slabs: number
  total: number
}

interface ProfileStatsProps {
  portfolioValue: string
  stats: PortfolioStats
}

export function ProfileStats({ portfolioValue, stats }: ProfileStatsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {/* Portfolio Value Card */}
      <Card style={styles.portfolioCard}>
        <CardContent style={styles.portfolioContent}>
          <View style={styles.portfolioHeader}>
            <View style={styles.portfolioIconContainer}>
              <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.portfolioTextContainer}>
              <Text style={styles.portfolioLabel}>Portfolio Value</Text>
              <Text style={styles.portfolioValue}>{portfolioValue}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Stats Grid Card */}
      <Card style={styles.statsCard}>
        <CardContent style={styles.statsContent}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="albums-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{stats.cards}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{stats.sealed}</Text>
              <Text style={styles.statLabel}>Sealed</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="diamond-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{stats.slabs}</Text>
              <Text style={styles.statLabel}>Slabs</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="stats-chart-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  portfolioCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  portfolioContent: {
    padding: SPACING.cardPadding,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  portfolioTextContainer: {
    flex: 1,
  },
  portfolioLabel: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.xs / 2,
  },
  portfolioValue: {
    fontSize: TYPOGRAPHY.h1,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  statsCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statsContent: {
    padding: SPACING.cardPadding,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '25%',
    marginBottom: SPACING.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
})
