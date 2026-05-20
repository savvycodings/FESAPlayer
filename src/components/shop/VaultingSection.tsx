import { useContext, useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, LISTING_TILE_BORDER } from '../../constants/layout'
import { androidLabelStyle, STABLE_TEXT_PROPS } from '../../utils/platformHelpers'

const LABEL_ICON_SIZE = 20

const VERIFICATION_INFO =
  "Send your cards in so we can verify you have them. We don't store your cards. We verify and return them. Buyers get protection on high value listings when you're ready to sell."

export function VaultingSection() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [infoVisible, setInfoVisible] = useState(false)

  return (
    <>
      <View style={styles.vaultingCard}>
        <View style={styles.vaultingTopContent}>
          <View style={styles.labelRow}>
            <Text style={styles.vaultingLabel} {...STABLE_TEXT_PROPS}>
              VERIFICATION
            </Text>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setInfoVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="How verification works"
            >
              <Ionicons
                name="help-circle-outline"
                size={LABEL_ICON_SIZE}
                color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.65)'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.vaultingTitle}>Get Your Cards Verified</Text>
          <Text style={[styles.vaultingTitle, styles.vaultingTitleSecond]}>
            Buyer protection on high value cards
          </Text>
        </View>

        <View style={styles.vaultingImageContainer}>
          <Image
            source={require('../../../assets/banner/slabs.png')}
            style={styles.vaultingImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setInfoVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verification</Text>
              <TouchableOpacity
                onPress={() => setInfoVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.textColor} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>{VERIFICATION_INFO}</Text>
          </View>
        </View>
      </Modal>
    </>
  )
}

const getStyles = (theme: {
  textColor?: string
  cardBackground?: string
  mutedForegroundColor?: string
  regularFont?: string
  boldFont?: string
}) =>
  StyleSheet.create({
    vaultingCard: {
      width: '100%',
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      paddingTop: SPACING.cardPadding,
      paddingHorizontal: SPACING.cardPadding,
      paddingBottom: SPACING.xs,
      borderWidth: 1,
      borderColor: theme.borderColor || LISTING_TILE_BORDER,
      backgroundColor: theme.cardBackground || '#000000',
    },
    vaultingTopContent: {
      width: '100%',
      marginBottom: SPACING.xs,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.xs,
      minHeight: LABEL_ICON_SIZE,
    },
    helpButton: {
      width: LABEL_ICON_SIZE,
      height: LABEL_ICON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vaultingLabel: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.7)',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      lineHeight: LABEL_ICON_SIZE,
      marginBottom: 0,
      paddingVertical: 0,
      ...androidLabelStyle,
    },
    vaultingTitle: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
      lineHeight: TYPOGRAPHY.body * 1.25,
      letterSpacing: -0.2,
      marginBottom: 0,
    },
    vaultingTitleSecond: {
      marginTop: SPACING.stackGap,
    },
    vaultingImageContainer: {
      width: '100%',
      borderRadius: RADIUS.md,
      overflow: 'hidden',
    },
    vaultingImage: {
      width: '100%',
      height: 240,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.containerPadding,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.cardBackground || '#1a1a1a',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: LISTING_TILE_BORDER,
      padding: SPACING.cardPadding,
      zIndex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    modalTitle: {
      flex: 1,
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
    },
    modalBody: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.8)',
      lineHeight: Math.round(TYPOGRAPHY.bodySmall * 1.45),
    },
  })
