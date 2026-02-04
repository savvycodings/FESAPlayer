import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useContext, useState } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, STORE_COLORS } from '../../constants/layout'
import { LevelRewardModal } from './LevelRewardModal'

interface ProgressBarsProps {
  level: number
  currentXP: number
  xpToNextLevel: number
  showVertical?: boolean
  profileImage?: any
  showNextLevelBadge?: boolean
}

// Get the reward for the next level
function getNextLevelReward(currentLevel: number) {
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

export function ProgressBars({
  level,
  currentXP,
  xpToNextLevel,
  showVertical = false,
  profileImage,
  showNextLevelBadge = false,
}: ProgressBarsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const progress = (currentXP / xpToNextLevel) * 100
  const nextReward = getNextLevelReward(level)

  const handleLevelPress = (lvl: number) => {
    setSelectedLevel(lvl)
    setModalVisible(true)
  }

  return (
    <>
      <View style={styles.container}>
        {showVertical && (
          <View style={styles.verticalContainer}>
            <View style={styles.verticalBar}>
              <View style={[styles.verticalFill, { height: `${progress}%` }]} />
            </View>
            <Text style={styles.levelText}>Lv {level}</Text>
          </View>
        )}

        <View style={styles.horizontalContainer}>
          {showNextLevelBadge && nextReward && (
            <View style={styles.rewardContainerAbove}>
              <TouchableOpacity
                style={styles.rewardContainer}
                onPress={() => handleLevelPress(level + 1)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={nextReward.icon}
                  size={14}
                  color={nextReward.color}
                  style={styles.rewardIcon}
                />
                <Text style={[styles.rewardText, { color: nextReward.color }]}>
                  Lv {level + 1}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.horizontalBar}>
            <View style={[styles.horizontalFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.xpTextContainer}>
            <Text style={styles.xpText}>
              {currentXP} / {xpToNextLevel} XP
            </Text>
          </View>
        </View>
      </View>

      <LevelRewardModal
        visible={modalVisible}
        level={selectedLevel || level + 1}
        userCurrentLevel={level}
        profileImage={profileImage}
        onClose={() => {
          setModalVisible(false)
          setSelectedLevel(null)
        }}
      />
    </>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalContainer: {
    alignItems: 'center',
  },
  verticalBar: {
    width: 8,
    height: 60,
    backgroundColor: theme.buttonBackground || 'rgba(0, 0, 0, 0.8)',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  verticalFill: {
    width: '100%',
    backgroundColor: theme.tintColor || '#73EC8B',
    position: 'absolute',
    bottom: 0,
  },
  levelText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  horizontalContainer: {
    flex: 1,
  },
  rewardContainerAbove: {
    marginBottom: SPACING.xs,
    alignItems: 'flex-end',
  },
  horizontalBar: {
    height: 8,
    backgroundColor: theme.buttonBackground || 'rgba(0, 0, 0, 0.8)',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  horizontalFill: {
    height: '100%',
    backgroundColor: theme.tintColor || '#73EC8B',
  },
  xpTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rewardContainer: {
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
})
