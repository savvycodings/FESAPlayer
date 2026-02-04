import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Svg, { Circle } from 'react-native-svg'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface GoalProgressProps {
  current: number
  goal: number
  label?: string
  size?: number
  strokeColor?: string
}

export function GoalProgress({
  current,
  goal,
  label = 'Total Cards',
  size = 180,
  strokeColor = '#FFFFFF',
}: GoalProgressProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, size)

  const progress = (current / goal) * 100
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference
  const remaining = goal - current

  return (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="flag-outline" size={20} color={strokeColor} />
            </View>
            <View>
              <Text style={styles.title}>Collection Goal</Text>
              <Text style={styles.subtitle}>{label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.circleContainer}>
            <Svg width={size} height={size} style={styles.svg}>
              {/* Background circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress arc */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={strokeColor}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={styles.circleInner}>
              <Text style={styles.progressNumber}>{current}</Text>
              <Text style={styles.progressLabel}>of {goal}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{remaining}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  )
}

const getStyles = (theme: any, size: number) => StyleSheet.create({
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
  progressContainer: {
    alignItems: 'center',
  },
  circleContainer: {
    width: size,
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: SPACING.md,
  },
  svg: {
    position: 'absolute',
  },
  circleInner: {
    width: size,
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: TYPOGRAPHY.h1 * 1.5,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
    letterSpacing: -0.3,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
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
  },
})
