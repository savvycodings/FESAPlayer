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
}

export function VaultingBadge({ status, size = 'md' }: VaultingBadgeProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, size)

  const getConfig = () => {
    switch (status) {
      case 'vaulted':
        return {
          icon: 'shield-checkmark' as const,
          color: '#FFFFFF',
          label: 'Vaulted',
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
          label: 'Busy Vaulting',
          bgColor: '#FFFFFF', // White background
          borderColor: '#EF4444', // Red border
        }
    }
  }

  const config = getConfig()
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
      <Ionicons
        name={config.icon}
        size={iconSize}
        color={config.color}
        style={styles.icon}
      />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  )
}

const getStyles = (theme: any, size: 'sm' | 'md' | 'lg') => {
  const padding = size === 'sm' ? 6 : size === 'md' ? 8 : 10
  const fontSize = size === 'sm' ? TYPOGRAPHY.label : size === 'md' ? TYPOGRAPHY.caption : TYPOGRAPHY.bodySmall

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
  })
}
