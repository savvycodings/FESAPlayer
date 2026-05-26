import { Platform, type ViewStyle } from 'react-native'
import { PILL_METRICS } from '../constants/layout'

export { STABLE_TEXT_PROPS } from './layoutHelpers'

export const isAndroid = Platform.OS === 'android'
export const isIOS = Platform.OS === 'ios'
export const isWeb = Platform.OS === 'web'

/** Android text vertical alignment fix for buttons/badges */
export const androidLabelStyle = isAndroid
  ? ({ includeFontPadding: false, textAlignVertical: 'center' as const } as const)
  : ({} as const)

export const compactLevelLineHeight = isAndroid ? 16 : 14

/** Label style for compact pills/badges — fixed lineHeight + Android vertical centering */
export function pillLabelStyle(
  fontSize: number = PILL_METRICS.fontSize,
  lineHeight: number = PILL_METRICS.lineHeight
): { fontSize: number; lineHeight: number } & typeof androidLabelStyle {
  return {
    fontSize,
    lineHeight,
    ...androidLabelStyle,
  }
}

/** Shared pill container — sizes from text lineHeight + paddingV, not parent flex box */
export function pillContainerBase(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
    paddingHorizontal: PILL_METRICS.paddingH,
    paddingVertical: PILL_METRICS.paddingV,
  }
}

