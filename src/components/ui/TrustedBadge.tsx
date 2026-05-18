import { View, StyleSheet, Platform } from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { ThemedText } from './ThemedText'
import { RADIUS } from '../../constants/layout'

/**
 * Compact "Trusted" pill for avatar overlays. Single icon + label, vertically centered.
 */
export function TrustedBadge() {
  const { theme } = useContext(ThemeContext)
  const tint = theme.tintColor || '#73EC8B'

  return (
    <View style={[styles.badge, { borderColor: tint }]}>
      <Ionicons name="shield-checkmark" size={11} color={tint} style={styles.icon} />
      <ThemedText style={[styles.label, { color: tint, fontFamily: theme.semiBoldFont }]}>
        Trusted
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    paddingHorizontal: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  icon: {
    marginRight: 3,
  },
  label: {
    fontSize: 10,
    lineHeight: Platform.OS === 'android' ? 12 : 11,
    letterSpacing: 0.15,
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false, textAlignVertical: 'center' as const }
      : {}),
  },
})
