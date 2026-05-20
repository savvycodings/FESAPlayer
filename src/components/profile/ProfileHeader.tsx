import { View, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native'
import { androidLabelStyle, compactLevelLineHeight } from '../../utils/platformHelpers'
import { useContext, useState, useMemo } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import {
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  STORE_COLORS,
  PROFILE_CHART_ACCENT,
  LISTING_TILE_BORDER,
} from '../../constants/layout'
import { ProgressBars } from '../store'
import { LevelRewardModal } from '../store/LevelRewardModal'
import { TrustedBadge } from '../ui/TrustedBadge'
import { PortfolioLineChart } from '../charts/PortfolioLineChart'

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
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('1M')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const chartAccent = PROFILE_CHART_ACCENT

  const portfolioValueZar = useMemo(() => {
    const n = parseFloat(String(portfolioValue).replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }, [portfolioValue])

  // Use API history when present; otherwise flat line at current portfolio value
  const chartData = useMemo(() => {
    if (portfolioData && portfolioData.length > 0) {
      return portfolioData
    }
    const pointCount = 7
    return Array.from({ length: pointCount }, (_, i) => ({
      x: i,
      y: portfolioValueZar,
    }))
  }, [portfolioData, portfolioValueZar])

  const hasHistory = portfolioData && portfolioData.length > 1
  const hasData = chartData.length > 0

  const latestValue = hasData ? (chartData[chartData.length - 1]?.y || 0) : 0
  const previousValue = hasData && chartData.length > 1 ? (chartData[chartData.length - 2]?.y || 0) : 0
  const change = latestValue - previousValue
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(1) : '0.0'

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
                disabled={!onEditPress}
              >
                {profileImage ? (
                  <Image
                    source={profileImage}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileImageEmpty}>
                    <Ionicons name="person-outline" size={28} color="rgba(255, 255, 255, 0.35)" />
                    <Text style={styles.profileImageEmptyText}>Add photo</Text>
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
              <View style={styles.trustedBadgeAnchor}>
                <TrustedBadge />
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

          <View style={styles.statsRow}>
            <Text style={styles.statInline}>
              <Text style={styles.statInlineNum}>
                {productsCount >= 1000 ? `${(productsCount / 1000).toFixed(1)}K` : productsCount}
              </Text>
              <Text style={styles.statInlineLabel}> Products</Text>
            </Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statInline}>
              <Text style={styles.statInlineNum}>
                {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : followersCount}
              </Text>
              <Text style={styles.statInlineLabel}> Followers</Text>
            </Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statInline}>
              <Text style={styles.statInlineNum}>
                {salesCount >= 1000 ? `${(salesCount / 1000).toFixed(1)}K` : salesCount}
              </Text>
              <Text style={styles.statInlineLabel}> Sales</Text>
            </Text>
          </View>
        </View>

        <View style={styles.portfolioValueSection}>
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <View style={styles.portfolioValueRow}>
              <Text style={[styles.portfolioValue, { color: chartAccent }]}>{portfolioValue}</Text>
              {change !== 0 && hasHistory && (
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

          {level !== undefined && currentXP !== undefined && xpToNextLevel !== undefined && (
            <View style={styles.progressContainer}>
              {nextReward ? (
                <View style={styles.levelBadgesRow}>
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
                </View>
              ) : null}
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

          {hasData ? (
            <PortfolioLineChart
              data={chartData}
              period={selectedPeriod}
              accentColor={chartAccent}
              height={200}
              roundYAxisThousands
              maxChartWidth={SCREEN_WIDTH - SPACING.containerPadding * 2}
            />
          ) : null}

        {hasHistory && chartData.length > 7 && (
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
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  profilePictureContainer: {
    marginBottom: SPACING.xs,
  },
  profileAndNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
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
  statInlineNum: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  statInlineLabel: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statDot: {
    fontSize: TYPOGRAPHY.label,
    color: 'rgba(255, 255, 255, 0.25)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: SPACING.pillPaddingH,
    height: SPACING.pillHeight,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
  },
  premiumText: {
    color: theme.textColor,
    fontFamily: theme.semiBoldFont,
    fontSize: TYPOGRAPHY.label,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  profileIconWrapper: {
    position: 'relative',
    width: SPACING.avatarProfile + 4,
    height: SPACING.avatarProfile + 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  profileIcon: {
    width: SPACING.avatarProfile,
    height: SPACING.avatarProfile,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: LISTING_TILE_BORDER,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 2,
  },
  ringOuter: {
    position: 'absolute',
    width: SPACING.avatarProfile + 4,
    height: SPACING.avatarProfile + 4,
    borderRadius: (SPACING.avatarProfile + 4) / 2,
    borderWidth: 2,
    opacity: 0.8,
    zIndex: 1,
  },
  ringInner: {
    position: 'absolute',
    width: SPACING.avatarProfile + 2,
    height: SPACING.avatarProfile + 2,
    borderRadius: (SPACING.avatarProfile + 2) / 2,
    borderWidth: 1,
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
  profileImageEmpty: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  profileImageEmptyText: {
    fontSize: 10,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 2,
  },
  trustedBadgeAnchor: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  progressContainer: {
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  levelBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    width: '100%',
  },
  levelBadge: {
    backgroundColor: theme.buttonFilledBg || '#FFFFFF',
    paddingHorizontal: SPACING.pillPaddingH,
    height: SPACING.pillHeight,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: SPACING.pillPaddingH,
    height: SPACING.pillHeight,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    fontSize: TYPOGRAPHY.label,
    lineHeight: compactLevelLineHeight,
    fontFamily: theme.boldFont,
    color: theme.buttonFilledFg || '#000000',
    ...androidLabelStyle,
  },
  portfolioValueSection: {
    marginTop: SPACING.xs,
    marginBottom: 0,
    paddingBottom: 0,
  },
  chartFocalFrame: {
    width: '100%',
    marginTop: SPACING.sm,
    padding: SPACING.xs,
    overflow: 'visible',
  },
  portfolioValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 0,
  },
  portfolioLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 0,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: TYPOGRAPHY.caption * 1.2,
  },
  portfolioValue: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: TYPOGRAPHY.h4 * 1.05,
    marginTop: 0,
  },
  periodSelectorContainer: {
    width: '100%',
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 2,
  },
  periodOption: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 36,
    height: SPACING.pillHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodOptionActive: {
    backgroundColor: theme.textColor,
  },
  periodOptionText: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '600',
  },
  periodOptionTextActive: {
    color: theme.backgroundColor,
  },
  chartSection: {
    width: '100%',
    marginTop: 0,
    marginBottom: 0,
    paddingTop: SPACING.xs,
    paddingBottom: 0,
    overflow: 'visible',
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
    zIndex: 10,
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
  userNameContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  userNameLarge: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    letterSpacing: -0.2,
    lineHeight: Math.round(TYPOGRAPHY.h3 * 1.1),
    ...androidLabelStyle,
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
