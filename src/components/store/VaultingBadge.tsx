import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, STORE_COLORS } from '../../constants/layout'

type VaultingStatus = 'vaulted' | 'seller-has' | 'unverified' | 'vaulting-in-process'

interface VaultingBadgeProps {
  status: VaultingStatus
  size?: 'sm' | 'md' | 'lg'
  /** Grey/muted style (e.g. for below Edit on own listings) */
  muted?: boolean
  /** When true, render only the label text (no icon, no pill) – typically with muted */
  textOnly?: boolean
}

export function VaultingBadge({ status, size = 'md', muted, textOnly }: VaultingBadgeProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, size)

  const getConfig = () => {
    switch (status) {
      case 'vaulted':
        return {
          icon: 'shield-checkmark' as const,
          color: '#FFFFFF',
          label: 'Verified',
          bgColor: STORE_COLORS.vaulted,
          borderColor: STORE_COLORS.vaulted,
        }
      case 'seller-has':
        return {
          icon: 'card' as const,
          color: '#FFFFFF',
          label: 'Seller Has',
          bgColor: STORE_COLORS.sellerHas,
          borderColor: STORE_COLORS.sellerHas,
        }
      case 'unverified':
        return {
          icon: 'warning' as const,
          color: '#FFFFFF',
          label: 'Unverified',
          bgColor: STORE_COLORS.unverified,
          borderColor: STORE_COLORS.unverified,
        }
      case 'vaulting-in-process':
        return {
          icon: 'hourglass-outline' as const,
          color: '#EF4444', // Red text and icon
          label: 'Verification in progress',
          bgColor: '#FFFFFF', // White background
          borderColor: '#EF4444', // Red border
        }
    }
  }

  const config = getConfig()
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16
  const bgColor = muted ? 'rgba(255, 255, 255, 0.12)' : config.bgColor
  const borderColor = muted ? 'rgba(255, 255, 255, 0.2)' : config.borderColor
  const textColor = muted || textOnly ? 'rgba(255, 255, 255, 0.6)' : config.color

  if (textOnly) {
    return (
      <Text style={[styles.label, styles.textOnlyLabel, { color: textColor }]}>
        {config.label}
      </Text>
    )
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }]}>
      <Ionicons
        name={config.icon}
        size={iconSize}
        color={textColor}
        style={styles.icon}
      />
      <Text style={[styles.label, { color: textColor }]}>
        {config.label}
      </Text>
    </View>
  )
}

const getStyles = (theme: any, size: 'sm' | 'md' | 'lg') => {
  const padding = size === 'sm' ? 4 : size === 'md' ? 6 : 8
  const fontSize = size === 'sm' ? 9 : size === 'md' ? TYPOGRAPHY.label : TYPOGRAPHY.caption

  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: padding,
      paddingVertical: padding / 2,
      borderRadius: RADIUS.full,
      alignSelf: 'flex-start',
      borderWidth: 1,
    },
    icon: {
      marginRight: SPACING.xs,
    },
    label: {
      fontSize: fontSize,
      fontFamily: theme.semiBoldFont,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    textOnlyLabel: {
      alignSelf: 'center',
    },
  })
}
