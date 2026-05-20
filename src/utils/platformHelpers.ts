import { Platform } from 'react-native'

export const isAndroid = Platform.OS === 'android'
export const isIOS = Platform.OS === 'ios'
export const isWeb = Platform.OS === 'web'

/** Android text vertical alignment fix for buttons/badges */
export const androidLabelStyle = isAndroid
  ? ({ includeFontPadding: false, textAlignVertical: 'center' as const } as const)
  : ({} as const)

export const compactLevelLineHeight = isAndroid ? 16 : 14
