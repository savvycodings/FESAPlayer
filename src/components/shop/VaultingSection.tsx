import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export function VaultingSection() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.vaultingCard}>
      {/* Title */}
      <View style={styles.vaultingTopContent}>
        <Text style={styles.vaultingLabel}>VAULTING</Text>
        <Text style={styles.vaultingTitle}>Get Your Cards Vaulted</Text>
        <Text style={styles.vaultingTitle}>and Professionally Graded</Text>
      </View>

      {/* Image */}
      <View style={styles.vaultingImageContainer}>
        <Image
          source={require('../../../assets/banner/slabs.png')}
          style={styles.vaultingImage}
          resizeMode="contain"
        />
      </View>

      {/* Description */}
      <Text style={styles.vaultingDescription}>
        Secure storage for your valuable cards in a climate controlled facility. Get your cards professionally graded and authenticated by industry experts before vaulting. We can sell them for you when you're ready.
      </Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.vaultingButton}
        activeOpacity={0.7}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={18}
          color="#000000"
          style={styles.shieldIcon}
        />
        <Text style={styles.vaultingButtonText}>Apply to Vault Today</Text>
      </TouchableOpacity>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  vaultingCard: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.cardPadding,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    backgroundColor: theme.cardBackground || '#000000',
  },
  vaultingTopContent: {
    width: '100%',
    marginBottom: -4,
  },
  vaultingLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  vaultingTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 0,
  },
  vaultingImageContainer: {
    width: '100%',
    marginBottom: -4,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  vaultingImage: {
    width: '100%',
    height: 360,
  },
  vaultingDescription: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  vaultingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: theme.tintColor || '#73EC8B',
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
  },
  shieldIcon: {
    marginRight: 8,
  },
  vaultingButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: '#000000',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
})
