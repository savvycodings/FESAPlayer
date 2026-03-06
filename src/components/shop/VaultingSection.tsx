import { View, StyleSheet, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export function VaultingSection() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.vaultingCard}>
      {/* Title */}
      <View style={styles.vaultingTopContent}>
        <Text style={styles.vaultingLabel}>VERIFICATION</Text>
        <Text style={styles.vaultingTitle}>Get Your Cards Verified</Text>
        <Text style={styles.vaultingTitle}>Buyer protection on high value cards</Text>
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
        Send your cards in so we can verify you have them. We don't store your cards. We verify and return them. Buyers get protection on high value listings when you're ready to sell.
      </Text>
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
  },
})
