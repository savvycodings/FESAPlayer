import { View, StyleSheet } from 'react-native'
import { androidLabelStyle } from '../../../utils/platformHelpers'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../../context'
import { ThemedText } from '../themed/ThemedText'
import { RADIUS } from '../../../constants/layout'

/**
 * Compact "Trusted" pill for avatar overlays. Single icon + label, vertically centered.
 */
export function TrustedBadge() {
  const { theme } = useContext(ThemeContext)
  const stroke = theme.buttonOutlineBorder || 'rgba(255,255,255,0.7)'
  const fg = theme.textColor || '#FFFFFF'

  return (
    <View style={[styles.badge, { borderColor: stroke }]}>
      <Ionicons name="shield-checkmark" size={9} color={fg} style={styles.icon} />
      <ThemedText style={[styles.label, { color: fg, fontFamily: theme.semiBoldFont }]}>
        Trusted
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
    minWidth: 52,
    paddingHorizontal: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  icon: {
    marginRight: 2,
    flexShrink: 0,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.15,
    ...androidLabelStyle,
  },
})
