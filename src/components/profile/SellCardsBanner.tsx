import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface SellCardsBannerProps {
  onPress?: () => void
}

export function SellCardsBanner({ onPress }: SellCardsBannerProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="trending-up"
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.bannerTitle}>Sell Your Cards</Text>
            <Text style={styles.bannerDescription}>
              List your cards and start earning today
            </Text>
          </View>
        </View>
        <View style={styles.bannerRight}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="rgba(255, 255, 255, 0.7)"
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  banner: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    marginBottom: SPACING.sectionGap,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: SPACING.xs,
    letterSpacing: -0.2,
  },
  bannerDescription: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: TYPOGRAPHY.bodySmall * 1.4,
  },
  bannerRight: {
    marginLeft: SPACING.md,
  },
})
