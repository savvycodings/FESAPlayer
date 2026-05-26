import { View, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native'
import { pillLabelStyle } from '../../utils/platformHelpers'
import { useContext, useState } from 'react'
import { Text } from '../ui/text'
import { ThemedText } from '../ui/ThemedText'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, PILL_METRICS } from '../../constants/layout'
import { VerificationRings } from './VerificationRings'
import { ProgressBars } from './ProgressBars'
import { LevelRewardModal } from './LevelRewardModal'
import { TrustedBadge } from '../ui/TrustedBadge'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Iconify } from 'react-native-iconify/native'

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
  showBannerEdit?: boolean
  onBannerEditPress?: () => void
  twitchUrl?: string
  youtubeUrl?: string
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
  showBannerEdit = false,
  onBannerEditPress,
  twitchUrl,
  youtubeUrl,
}: StoreHeaderProps) {
  const openUrl = (url: string) => {
    const u = url.trim()
    if (!u) return
    const href = u.startsWith('http') ? u : `https://${u}`
    Linking.openURL(href).catch(() => {})
  }
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
                <View style={styles.profileIcon}>
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
                </View>
                <VerificationRings salesCount={salesCount} size={SPACING.avatarProfile + 4} />
                <View style={styles.trustedBadgeAnchor}>
                  <TrustedBadge />
                </View>
              </View>
            </View>

            <View style={styles.bannerInfoSection}>
              <View style={styles.storeInfoStack}>
                <View style={styles.storeNameRow}>
                  <ThemedText
                    style={styles.storeName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    ellipsizeMode="clip"
                  >
                    {storeName}
                  </ThemedText>
                  {(twitchUrl || youtubeUrl) && (
                    <View style={styles.socialIconsRow}>
                      {twitchUrl ? (
                        <TouchableOpacity
                          style={styles.socialIconButton}
                          onPress={() => openUrl(twitchUrl)}
                          activeOpacity={0.7}
                          accessibilityLabel="Open Twitch"
                        >
                          <Iconify icon="simple-icons:twitch" size={22} color={theme.textColor} />
                        </TouchableOpacity>
                      ) : null}
                      {youtubeUrl ? (
                        <TouchableOpacity
                          style={styles.socialIconButton}
                          onPress={() => openUrl(youtubeUrl)}
                          activeOpacity={0.7}
                          accessibilityLabel="Open YouTube"
                        >
                          <Iconify icon="simple-icons:youtube" size={22} color={theme.textColor} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.levelBadge}
                  onPress={() => handleLevelPress(level)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.levelText}>Lv {level}</ThemedText>
                </TouchableOpacity>

                <View style={styles.progressWrap}>
                  <ProgressBars
                    level={level}
                    currentXP={currentXP}
                    xpToNextLevel={xpToNextLevel}
                    showVertical={false}
                    profileImage={profileImage}
                  />
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
    marginBottom: SPACING.md,
  },
  bannerContainer: {
    width: '100%',
    height: 168,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 0,
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
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  textOverlayBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  bannerProfileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerInfoSection: {
    flex: 1,
    paddingLeft: SPACING.xs,
    minHeight: SPACING.avatarProfile,
    justifyContent: 'flex-start',
  },
  storeInfoStack: {
    gap: SPACING.xs,
    paddingTop: 0,
  },
  progressWrap: {
    width: '100%',
  },
  profileContainer: {
    marginRight: SPACING.md,
  },
  profileWrapper: {
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
  trustedBadgeAnchor: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  infoSection: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  storeName: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: TYPOGRAPHY.h3,
    lineHeight: TYPOGRAPHY.h3 * 1.15,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginRight: SPACING.sm,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  socialIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: SPACING.xs,
  },
  socialIconButton: {
    padding: SPACING.xs,
  },
  levelBadge: {
    backgroundColor: theme.buttonFilledBg || '#FFFFFF',
    paddingHorizontal: PILL_METRICS.paddingH,
    paddingVertical: PILL_METRICS.paddingV,
    borderRadius: RADIUS.full,
    marginTop: 0,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: theme.boldFont,
    color: theme.buttonFilledFg || '#000000',
    ...pillLabelStyle(PILL_METRICS.fontSize, PILL_METRICS.lineHeight),
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
