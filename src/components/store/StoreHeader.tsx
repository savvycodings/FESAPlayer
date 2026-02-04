import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useContext, useState } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { VerificationRings } from './VerificationRings'
import { ProgressBars } from './ProgressBars'
import { LevelRewardModal } from './LevelRewardModal'
import Ionicons from '@expo/vector-icons/Ionicons'

interface StoreHeaderProps {
  storeName: string
  bannerUrl?: string | any
  profileImage?: any
  profileInitials: string
  level: number
  currentXP: number
  xpToNextLevel: number
  salesCount: number
  shareableLink: string
  onEditPress?: () => void
  showBannerEdit?: boolean
  onBannerEditPress?: () => void
}

export function StoreHeader({
  storeName,
  bannerUrl,
  profileImage,
  profileInitials,
  level,
  currentXP,
  xpToNextLevel,
  salesCount,
  shareableLink,
  onEditPress,
  showBannerEdit = false,
  onBannerEditPress,
}: StoreHeaderProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const handleLevelPress = (lvl: number) => {
    setSelectedLevel(lvl)
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      {/* Banner Section with Content */}
      <View style={styles.bannerContainer}>
        {bannerUrl ? (
          <Image
            source={typeof bannerUrl === 'string' ? { uri: bannerUrl } : bannerUrl}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bannerPlaceholder} />
        )}
        
        {/* Edit Banner Button */}
        {showBannerEdit && (
          <TouchableOpacity
            style={styles.bannerEditButton}
            onPress={onBannerEditPress}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {/* Content Overlay */}
        <View style={styles.bannerContentOverlay}>
          <View style={styles.textOverlayBackground} />
          <View style={styles.bannerProfileSection}>
            <View style={styles.profileContainer}>
              <View style={styles.profileWrapper}>
                <TouchableOpacity
                  style={styles.profileIcon}
                  onPress={onEditPress}
                  activeOpacity={0.8}
                >
                  {profileImage ? (
                    <Image
                      source={profileImage}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.profileInitialsContainer}>
                      <Text style={styles.profileInitialsText}>{profileInitials}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <VerificationRings salesCount={salesCount} size={108} />
                <View style={styles.trustedBadge}>
                  <View style={styles.shieldIconContainer}>
                    <Ionicons name="shield-outline" size={12} color={theme.tintColor || '#73EC8B'} style={styles.shieldIcon} />
                    <Ionicons name="checkmark" size={8} color="rgba(0, 0, 0, 0.6)" style={styles.checkmarkIcon} />
                  </View>
                  <Text style={styles.trustedText}>Trusted</Text>
                </View>
              </View>
            </View>

            <View style={styles.bannerInfoSection}>
              <View style={styles.storeNameRow}>
                <Text style={styles.storeName}>{storeName}</Text>
                <TouchableOpacity
                  style={styles.levelBadge}
                  onPress={() => handleLevelPress(level)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.levelText}>Lv {level}</Text>
                </TouchableOpacity>
              </View>

              <ProgressBars
                level={level}
                currentXP={currentXP}
                xpToNextLevel={xpToNextLevel}
                showVertical={false}
                profileImage={profileImage}
              />

              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Ionicons name="rocket-outline" size={16} color={theme.tintColor || '#73EC8B'} style={styles.featureIcon} />
                  <Text style={styles.featureText}>Fast Shipping</Text>
                </View>
                <View style={styles.separator} />
                <View style={styles.featureItem}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.tintColor || '#73EC8B'} style={styles.featureIcon} />
                  <Text style={styles.featureText}>Buyer Protection</Text>
                </View>
                <View style={styles.separator} />
                <View style={styles.featureItem}>
                  <Ionicons name="star-outline" size={16} color={theme.tintColor || '#73EC8B'} style={styles.featureIcon} />
                  <Text style={styles.featureText}>Top Rated Seller</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Level Reward Modal */}
      <LevelRewardModal
        visible={modalVisible}
        level={selectedLevel || level}
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
    marginBottom: SPACING.sectionGap,
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.cardBackground || '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  bannerPlaceholderText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  bannerEditButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  bannerContentOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.containerPadding,
    justifyContent: 'center',
  },
  textOverlayBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerProfileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerInfoSection: {
    flex: 1,
  },
  profileContainer: {
    marginRight: SPACING.md,
  },
  profileWrapper: {
    position: 'relative',
    width: 108,
    height: 108,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 108,
    height: 108,
    borderRadius: RADIUS.full,
    backgroundColor: theme.textColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitialsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitialsText: {
    color: theme.backgroundColor,
    fontFamily: theme.boldFont,
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '600',
  },
  trustedBadge: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -35 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
  },
  shieldIconContainer: {
    position: 'relative',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    position: 'absolute',
  },
  checkmarkIcon: {
    position: 'absolute',
  },
  trustedText: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  infoSection: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  storeName: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginRight: SPACING.sm,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  levelBadge: {
    backgroundColor: theme.tintColor || '#73EC8B',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  levelText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.boldFont,
    color: '#000000',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    marginRight: 0,
  },
  featureText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.7)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
