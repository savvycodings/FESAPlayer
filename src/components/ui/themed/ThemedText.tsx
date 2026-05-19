import { Text as RNText, type TextProps } from 'react-native'
import { STABLE_TEXT_PROPS } from '../../../utils/layoutHelpers'

/**
 * Plain React Native Text for StyleSheet theme typography.
 * Use this instead of ui/text when you set fontFamily/color/fontSize via theme — NativeWind will not override them.
 */
export function ThemedText({ style, ...props }: TextProps) {
  return <RNText style={style} {...STABLE_TEXT_PROPS} {...props} />
}
