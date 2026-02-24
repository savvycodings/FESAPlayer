import { View, StyleSheet, ViewStyle } from 'react-native'
import { ACCENT_BRACKET } from '../../constants/layout'

const BRACKET_LENGTH = 18
const BRACKET_THICKNESS = 2.5
const OFFSET = 2

interface FocalBracketsProps {
  children: React.ReactNode
  /** Accent color for the corner brackets. Defaults to bright orange. */
  accentColor?: string
  /** Length of each bracket leg in px. */
  bracketLength?: number
  /** Stroke thickness of brackets. */
  bracketThickness?: number
  /** Gap between brackets and the inner content. */
  offset?: number
  style?: ViewStyle
}

/**
 * Corner Frame Overlay: four L-shaped corner markers, bright theme accent, absolutely
 * positioned. Use with a center icon (white stroke, no fill, thin outline) for
 * tactical/HUD-style focal points. See app/docs/ICON_AND_FOCAL_FRAME.md.
 */
export function FocalBrackets({
  children,
  accentColor = ACCENT_BRACKET,
  bracketLength = BRACKET_LENGTH,
  bracketThickness = BRACKET_THICKNESS,
  offset = OFFSET,
  style,
}: FocalBracketsProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {children}
      {/* Top-left */}
      <View
        style={[
          styles.corner,
          styles.topLeft,
          {
            left: -offset,
            top: -offset,
            width: bracketLength,
            height: bracketLength,
            borderTopWidth: bracketThickness,
            borderLeftWidth: bracketThickness,
            borderColor: accentColor,
          },
        ]}
      />
      {/* Top-right */}
      <View
        style={[
          styles.corner,
          styles.topRight,
          {
            right: -offset,
            top: -offset,
            width: bracketLength,
            height: bracketLength,
            borderTopWidth: bracketThickness,
            borderRightWidth: bracketThickness,
            borderColor: accentColor,
          },
        ]}
      />
      {/* Bottom-left */}
      <View
        style={[
          styles.corner,
          styles.bottomLeft,
          {
            left: -offset,
            bottom: -offset,
            width: bracketLength,
            height: bracketLength,
            borderBottomWidth: bracketThickness,
            borderLeftWidth: bracketThickness,
            borderColor: accentColor,
          },
        ]}
      />
      {/* Bottom-right */}
      <View
        style={[
          styles.corner,
          styles.bottomRight,
          {
            right: -offset,
            bottom: -offset,
            width: bracketLength,
            height: bracketLength,
            borderBottomWidth: bracketThickness,
            borderRightWidth: bracketThickness,
            borderColor: accentColor,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  corner: {
    position: 'absolute',
  },
  topLeft: {},
  topRight: {},
  bottomLeft: {},
  bottomRight: {},
})
