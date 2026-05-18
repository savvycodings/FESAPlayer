import { Platform, type ViewStyle } from 'react-native'
import { SPACING } from '../constants/layout'

/** Prevent system font scaling from breaking badge/button layouts on Android emulator & devices. */
export const STABLE_TEXT_PROPS = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const

/** Center a bottom badge without left:50% + translateX (unreliable on Android). */
export const bottomCenteredBadgeAnchor: ViewStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  alignItems: 'center',
}

/** Two-column listing grid item width that accounts for container padding and gap. */
export function getTwoColumnItemWidth(
  screenWidth: number,
  options?: { containerPadding?: number; gap?: number; columns?: number }
): number {
  const containerPadding = options?.containerPadding ?? SPACING.containerPadding
  const gap = options?.gap ?? 8
  const columns = options?.columns ?? 2
  const totalGap = gap * (columns - 1)
  const available = screenWidth - containerPadding * 2 - totalGap
  return Math.floor(available / columns)
}

export function applyStableTextDefaults() {
  if (Platform.OS === 'web') return
  try {
    const { Text: RNText, TextInput } = require('react-native')
    if (RNText.defaultProps == null) RNText.defaultProps = {}
    RNText.defaultProps.allowFontScaling = false
    RNText.defaultProps.maxFontSizeMultiplier = 1
    if (TextInput.defaultProps == null) TextInput.defaultProps = {}
    TextInput.defaultProps.allowFontScaling = false
    TextInput.defaultProps.maxFontSizeMultiplier = 1
  } catch {
    // ignore
  }
}
