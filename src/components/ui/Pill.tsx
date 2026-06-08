import {
  View,
  Text as RNText,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useContext, useMemo } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { PILL_METRICS } from '../../constants/layout'
import { pillContainerBase, pillLabelStyle } from '../../utils/platformHelpers'

/** Built-in looks — override any token via PillStyleOverrides */
export type PillPreset =
  | 'outline'
  | 'filled'
  | 'listed'
  | 'positive'
  | 'negative'
  | 'subtle'
  | 'accent'

export type PillStyleOverrides = {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  textColor?: string
  iconColor?: string
}

export interface PillProps extends PillStyleOverrides {
  label: string
  /** Preset palette; individual color/border props override the preset */
  preset?: PillPreset
  icon?: React.ComponentProps<typeof Ionicons>['name']
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  /** Vertical alignment when placed beside larger text (e.g. portfolio value) */
  align?: 'start' | 'center'
  accessibilityLabel?: string
}

type ResolvedPillStyle = Required<
  Pick<PillStyleOverrides, 'backgroundColor' | 'borderColor' | 'borderWidth' | 'textColor' | 'iconColor'>
>

const PRESETS: Record<PillPreset, ResolvedPillStyle> = {
  outline: {
    backgroundColor: '#000000',
    borderColor: '#FFFFFF',
    borderWidth: PILL_METRICS.borderWidth,
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  filled: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
    borderWidth: 0,
    textColor: '#000000',
    iconColor: '#000000',
  },
  listed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    textColor: 'rgba(255, 255, 255, 0.55)',
    iconColor: 'rgba(255, 255, 255, 0.55)',
  },
  positive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'transparent',
    borderWidth: 0,
    textColor: '#10B981',
    iconColor: '#10B981',
  },
  negative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'transparent',
    borderWidth: 0,
    textColor: '#EF4444',
    iconColor: '#EF4444',
  },
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    textColor: 'rgba(255, 255, 255, 0.9)',
    iconColor: 'rgba(255, 255, 255, 0.9)',
  },
  accent: {
    backgroundColor: 'rgba(115, 236, 139, 0.15)',
    borderColor: 'rgba(115, 236, 139, 0.45)',
    borderWidth: 1,
    textColor: '#73EC8B',
    iconColor: '#73EC8B',
  },
}

function resolvePillStyle(
  preset: PillPreset,
  theme: { textColor?: string; backgroundColor?: string },
  overrides: PillStyleOverrides
): ResolvedPillStyle {
  const base = { ...PRESETS[preset] }
  if (preset === 'filled' && theme.textColor) {
    base.backgroundColor = theme.textColor
    base.textColor = theme.backgroundColor || '#000000'
    base.iconColor = theme.backgroundColor || '#000000'
  }
  return {
    backgroundColor: overrides.backgroundColor ?? base.backgroundColor,
    borderColor: overrides.borderColor ?? base.borderColor,
    borderWidth: overrides.borderWidth ?? base.borderWidth,
    textColor: overrides.textColor ?? base.textColor,
    iconColor: overrides.iconColor ?? base.iconColor,
  }
}

/**
 * Global compact pill — height follows label lineHeight + padding, not the parent row.
 * Use preset for common styles, or pass borderColor / textColor / etc. for one-offs.
 */
export function Pill({
  label,
  preset = 'outline',
  icon,
  onPress,
  style,
  align = 'start',
  accessibilityLabel,
  backgroundColor,
  borderColor,
  borderWidth,
  textColor,
  iconColor,
}: PillProps) {
  const { theme } = useContext(ThemeContext)
  const resolved = useMemo(
    () =>
      resolvePillStyle(preset, theme, {
        backgroundColor,
        borderColor,
        borderWidth,
        textColor,
        iconColor,
      }),
    [
      preset,
      theme,
      backgroundColor,
      borderColor,
      borderWidth,
      textColor,
      iconColor,
    ]
  )
  const labelStyle = pillLabelStyle(PILL_METRICS.fontSize, PILL_METRICS.lineHeight)

  const content = (
    <View
      style={[
        pillContainerBase(),
        {
          borderRadius: PILL_METRICS.borderRadius,
          backgroundColor: resolved.backgroundColor,
          borderWidth: resolved.borderWidth,
          borderColor: resolved.borderColor,
          alignSelf: align === 'center' ? 'center' : 'flex-start',
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={PILL_METRICS.iconSize}
          color={resolved.iconColor}
          style={{ marginRight: PILL_METRICS.iconGap, flexShrink: 0 }}
        />
      ) : null}
      <RNText
        style={[
          {
            fontFamily: theme.semiBoldFont,
            fontWeight: '600',
            color: resolved.textColor,
          },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </RNText>
    </View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => (pressed ? styles.pressed : undefined)}
      >
        {content}
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
})
