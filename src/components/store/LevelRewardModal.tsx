import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native'
import { useContext, useState } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, STORE_COLORS } from '../../constants/layout'

interface LevelRewardModalProps {
  visible: boolean
  level: number
  userCurrentLevel?: number
  profileImage?: any
  onClose: () => void
}

interface Benefit {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
}

function getLevelRewards(level: number) {
  const allLevels: Record<number, any> = {
    1: {
      title: 'Level 1 - Starter',
      ringColor: '#666666',
      ringName: 'Basic Access',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Create Store', description: 'List up to 10 cards in your store' },
        { icon: 'cash-outline' as const, title: 'Standard Fees', description: '5% success fee on all sales' },
        { icon: 'shield-outline' as const, title: 'Basic Support', description: 'Community support access' },
      ],
    },
    2: {
      title: 'Level 2 - Rising',
      ringColor: '#888888',
      ringName: 'Bronze Access',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'More Listings', description: 'List up to 25 cards in your store' },
        { icon: 'cash-outline' as const, title: 'Reduced Fees', description: '4.5% success fee on all sales' },
        { icon: 'analytics-outline' as const, title: 'Basic Analytics', description: 'View sales statistics and trends' },
      ],
    },
    3: {
      title: 'Level 3 - Established',
      ringColor: '#C0C0C0',
      ringName: 'Silver Access',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Expanded Store', description: 'List up to 50 cards in your store' },
        { icon: 'cash-outline' as const, title: 'Lower Fees', description: '4% success fee on all sales' },
        { icon: 'trophy-outline' as const, title: 'Silver Badge', description: 'Silver verification badge on profile' },
        { icon: 'mail-outline' as const, title: 'Email Updates', description: 'Get invited to exclusive events and promotions' },
      ],
    },
    4: {
      title: 'Level 4 - Gold Tier',
      ringColor: STORE_COLORS.gold,
      ringName: 'Gold Ring',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Enhanced Store', description: 'List up to 100 cards in your store' },
        { icon: 'cash-outline' as const, title: 'Reduced Fees', description: '3.5% success fee on all sales' },
        { icon: 'diamond-outline' as const, title: 'Gold Ring Badge', description: 'Custom gold ring around your profile' },
        { icon: 'mail-outline' as const, title: 'Event Invitations', description: 'Invited to exclusive trading events and meetups' },
        { icon: 'trending-up-outline' as const, title: 'Advanced Analytics', description: 'Access detailed insights on sales and trends' },
        { icon: 'gift-outline' as const, title: 'Promotional Tools', description: 'Create flash sales and bundle deals' },
      ],
    },
    5: {
      title: 'Level 5 - Platinum Tier',
      ringColor: STORE_COLORS.platinum,
      ringName: 'Platinum Ring',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Large Store', description: 'List up to 200 cards in your store' },
        { icon: 'cash-outline' as const, title: 'Lower Fees', description: '3% success fee on all sales' },
        { icon: 'diamond-outline' as const, title: 'Platinum Ring Badge', description: 'Custom platinum ring around your profile' },
        { icon: 'calendar-outline' as const, title: 'VIP Events', description: 'Priority access to exclusive events and conferences' },
        { icon: 'rocket-outline' as const, title: 'Featured Placement', description: 'Top placement in verified stores carousel' },
      ],
    },
    6: {
      title: 'Level 6 - Diamond Tier',
      ringColor: STORE_COLORS.diamond,
      ringName: 'Diamond Ring',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Premium Store', description: 'List unlimited cards in your store' },
        { icon: 'cash-outline' as const, title: 'Minimal Fees', description: '2.5% success fee on all sales' },
        { icon: 'diamond' as const, title: 'Diamond Ring Badge', description: 'Custom diamond ring around your profile' },
        { icon: 'star-outline' as const, title: 'Elite Events', description: 'Exclusive access to elite trading events and tournaments' },
        { icon: 'business-outline' as const, title: 'Store Customization', description: 'Fully customize your store with custom themes' },
      ],
    },
    7: {
      title: 'Level 7 - Master Tier',
      ringColor: '#9B59B6',
      ringName: 'Purple Ring',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Unlimited Store', description: 'List unlimited cards with premium features' },
        { icon: 'cash-outline' as const, title: 'Ultra Low Fees', description: '2% success fee on all sales' },
        { icon: 'diamond-outline' as const, title: 'Master Ring Badge', description: 'Custom purple ring around your profile' },
        { icon: 'flash-outline' as const, title: 'Early Features', description: 'First access to new platform features and tools' },
        { icon: 'people-outline' as const, title: 'Master Community', description: 'Join exclusive master seller community' },
      ],
    },
    8: {
      title: 'Level 8 - Legendary Tier',
      ringColor: '#E67E22',
      ringName: 'Orange Ring',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Elite Store', description: 'Unlimited listings with all premium features' },
        { icon: 'cash-outline' as const, title: 'Minimal Fees', description: '1.5% success fee on all sales' },
        { icon: 'diamond-outline' as const, title: 'Legendary Ring Badge', description: 'Custom orange ring around your profile' },
        { icon: 'trophy-outline' as const, title: 'Championship Access', description: 'Access to championship events and competitions' },
        { icon: 'business-outline' as const, title: 'Advanced Customization', description: 'Complete store branding and customization' },
        { icon: 'star-outline' as const, title: 'Legendary Status', description: 'Featured in legendary sellers showcase' },
      ],
    },
    9: {
      title: 'Level 9 - Supreme Tier',
      ringColor: '#E74C3C',
      ringName: 'Red Ring',
      benefits: [
        { icon: 'storefront-outline' as const, title: 'Supreme Store', description: 'Unlimited listings with all features unlocked' },
        { icon: 'cash-outline' as const, title: 'Lowest Fees', description: '1% success fee on all sales' },
        { icon: 'diamond' as const, title: 'Supreme Ring Badge', description: 'Custom red ring around your profile' },
        { icon: 'crown-outline' as const, title: 'Supreme Access', description: 'Exclusive access to all platform features and events' },
        { icon: 'rocket-outline' as const, title: 'Partnership Opportunities', description: 'Exclusive partnership and collaboration opportunities' },
      ],
    },
  }
  
  return allLevels[level] || null
}

export function LevelRewardModal({
  visible,
  level,
  userCurrentLevel,
  profileImage,
  onClose,
}: LevelRewardModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const rewards = getLevelRewards(level)
  const [selectedLevel, setSelectedLevel] = useState(level)
  const selectedRewards = getLevelRewards(selectedLevel)

  const currentLevel = userCurrentLevel ?? level - 1

  if (!rewards) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Level Rewards</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {/* Content */}
            <View style={styles.content}>
              {/* Levels Timeline */}
              <View style={styles.levelsTimeline}>
                {Array.from({ length: 9 }, (_, i) => i + 1).map((lvl) => {
                  const isCurrentLevel = lvl === currentLevel
                  const isUnlocked = lvl <= currentLevel
                  const isSelected = lvl === selectedLevel
                  const levelColors: Record<number, string> = {
                    3: '#C0C0C0',
                    4: STORE_COLORS.gold,
                    5: STORE_COLORS.platinum,
                    6: STORE_COLORS.diamond,
                    7: '#9B59B6',
                    8: '#E67E22',
                    9: '#E74C3C',
                  }
                  const levelColor = levelColors[lvl] || 'rgba(255, 255, 255, 0.3)'
                  
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={styles.levelDotContainer}
                      onPress={() => setSelectedLevel(lvl)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.levelDot,
                          isUnlocked && styles.levelDotUnlocked,
                          isCurrentLevel && styles.levelDotCurrent,
                          isSelected && styles.levelDotSelected,
                          { borderColor: isUnlocked && lvl >= 4 ? levelColor : (isUnlocked ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)') },
                        ]}
                      >
                        {lvl >= 4 && isUnlocked && (
                          <View style={[styles.levelDotFill, { backgroundColor: levelColor }]} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.levelDotText,
                          isUnlocked && styles.levelDotTextUnlocked,
                          isCurrentLevel && styles.levelDotTextCurrent,
                          isSelected && styles.levelDotTextSelected,
                        ]}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {selectedRewards && (
                <>
                  {/* Profile Ring Preview */}
                  <View style={styles.ringPreviewSection}>
                    <View style={styles.ringPreviewContainer}>
                      <View style={styles.profilePreview}>
                        <View style={styles.profileCircle}>
                          {profileImage ? (
                            <Image
                              source={profileImage}
                              style={styles.profileImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.profileInitials}>MK</Text>
                          )}
                        </View>
                        <View style={[styles.ringOuter, { borderColor: selectedRewards.ringColor }]} />
                        <View style={[styles.ringInner, { borderColor: selectedRewards.ringColor }]} />
                      </View>
                    </View>
                    <Text style={styles.ringTitle}>{selectedRewards.ringName}</Text>
                    <Text style={styles.ringDescription}>
                      {selectedLevel <= currentLevel 
                        ? `You've unlocked the ${selectedRewards.ringName.toLowerCase()}`
                        : `Unlock a ${selectedRewards.ringName.toLowerCase()} around your profile picture to show your trusted seller status`
                      }
                    </Text>
                  </View>

                  <Text style={styles.descriptionText}>
                    {selectedLevel <= currentLevel 
                      ? `At Level ${selectedLevel}, you receive:`
                      : `By reaching Level ${selectedLevel}, you'll receive:`
                    }
                  </Text>
                  <View style={styles.benefitsContainer}>
                    {selectedRewards.benefits.map((benefit, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.benefitBlock,
                          index === selectedRewards.benefits.length - 1 && { marginBottom: 0 }
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={selectedRewards.ringColor}
                          style={styles.checkIcon}
                        />
                        <Text style={styles.benefitText}>{benefit.description}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayTouchable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContainer: {
      backgroundColor: theme.backgroundColor,
      borderRadius: RADIUS.lg,
      width: '85%',
      maxWidth: 400,
      maxHeight: '85%',
      padding: SPACING.containerPadding,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: SPACING.xs,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: TYPOGRAPHY.h2,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
      flex: 1,
    },
    closeButton: {
      padding: SPACING.xs,
      marginLeft: SPACING.sm,
    },
    content: {
      marginBottom: SPACING.md,
    },
    ringPreviewSection: {
      alignItems: 'center',
      marginBottom: SPACING.lg,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.md,
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    ringPreviewContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    profilePreview: {
      width: 100,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    profileCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.textColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#FFFFFF',
      zIndex: 2,
      overflow: 'hidden',
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    profileInitials: {
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '600',
    },
    ringOuter: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      opacity: 0.8,
      zIndex: 1,
    },
    ringInner: {
      position: 'absolute',
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 2,
      opacity: 0.6,
      zIndex: 1,
    },
    ringTitle: {
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: SPACING.xs,
      textAlign: 'center',
    },
    ringDescription: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    descriptionText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: SPACING.lg,
      lineHeight: TYPOGRAPHY.body * 1.4,
    },
    benefitsContainer: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    benefitBlock: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    checkIcon: {
      marginRight: SPACING.sm,
      marginTop: 2,
    },
    benefitText: {
      flex: 1,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: TYPOGRAPHY.body * 1.4,
    },
    levelsTimeline: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
      paddingHorizontal: SPACING.xs,
    },
    levelDotContainer: {
      alignItems: 'center',
      flex: 1,
    },
    levelDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    levelDotUnlocked: {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    levelDotCurrent: {
      borderWidth: 3,
      backgroundColor: 'rgba(115, 236, 139, 0.2)',
    },
    levelDotSelected: {
      borderWidth: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    levelDotFill: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    levelDotText: {
      fontSize: 10,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.3)',
    },
    levelDotTextUnlocked: {
      color: 'rgba(255, 255, 255, 0.6)',
    },
    levelDotTextCurrent: {
      color: theme.tintColor || '#73EC8B',
      fontFamily: theme.boldFont,
      fontWeight: '600',
    },
    levelDotTextSelected: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontWeight: '600',
    },
  })
