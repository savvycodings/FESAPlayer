import {
  Pressable,
  View,
  Text as RNText,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { androidLabelStyle } from '../../utils/platformHelpers'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import {
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  CARD_SURFACE,
  LISTING_TILE_BORDER,
  BUTTON_ACCENT,
} from '../../constants/layout'

export type AppButtonVariant = 'filled' | 'outline' | 'accent'
export type AppButtonSize = 'sm' | 'md' | 'lg'

export interface AppButtonProps {
  variant?: AppButtonVariant
  size?: AppButtonSize
  label?: string
  icon?: React.ComponentProps<typeof Ionicons>['name']
  onPress?: () => void
  disabled?: boolean
  fullWidth?: boolean
  /** Tight padding for narrow listing tiles — no icon, single-line label */
  tile?: boolean
  /** White fill / outline on black cards (listing tiles, accordions) */
  onDarkSurface?: boolean
  style?: StyleProp<ViewStyle>
}

const SIZE_HEIGHT: Record<AppButtonSize, number> = {
  sm: 32,
  md: 36,
  lg: 40,
}

const TILE_HEIGHT = 28

const ICON_SIZE: Record<AppButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 20,
}

export function AppButton({
  variant = 'filled',
  size = 'md',
  label,
  icon,
  onPress,
  disabled = false,
  fullWidth = false,
  tile = false,
  onDarkSurface = false,
  style,
}: AppButtonProps) {
  const { theme } = useContext(ThemeContext)
  const useIcon = Boolean(icon && !tile)
  const hasIconAndLabel = Boolean(useIcon && label)
  const height = tile ? TILE_HEIGHT : SIZE_HEIGHT[size]
  const isIconOnly = Boolean(useIcon && !label)
  const surface = onDarkSurface || tile ? CARD_SURFACE : null
  const fg =
    variant === 'accent'
      ? BUTTON_ACCENT.foreground
      : variant === 'filled'
        ? surface
          ? surface.buttonFilledFg
          : theme.buttonFilledFg ?? '#000000'
        : surface
          ? surface.buttonOutlineFg
          : theme.buttonOutlineFg ?? '#FFFFFF'
  const styles = getStyles(
    theme,
    variant,
    size,
    height,
    fullWidth,
    isIconOnly,
    tile,
    hasIconAndLabel,
    surface,
    fg
  )

  const pressable = (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={tile ? 4 : 8}
      style={({ pressed }) => [
        styles.button,
        variant === 'accent' && styles.buttonAccentInner,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      android_ripple={
        variant === 'accent' || variant === 'filled'
          ? { color: 'rgba(0,0,0,0.12)' }
          : { color: 'rgba(255,255,255,0.12)' }
      }
    >
      <View style={styles.content}>
        {useIcon ? (
          <Ionicons
            name={icon!}
            size={tile ? 14 : ICON_SIZE[size]}
            color={fg}
            style={styles.icon}
          />
        ) : null}
        {label ? (
          <RNText style={styles.label} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </RNText>
        ) : null}
      </View>
    </Pressable>
  )

  if (variant === 'accent') {
    return (
      <View
        style={[
          styles.accentStroke,
          tile && fullWidth && styles.accentStrokeTileFull,
          disabled && styles.disabled,
          style,
        ]}
      >
        {pressable}
      </View>
    )
  }

  return pressable
}

function getStyles(
  theme: {
    buttonFilledBg?: string
    buttonOutlineBorder?: string
    semiBoldFont?: string
  },
  variant: AppButtonVariant,
  size: AppButtonSize,
  height: number,
  fullWidth: boolean,
  isIconOnly: boolean,
  tile: boolean,
  hasIconAndLabel: boolean,
  surface: typeof CARD_SURFACE | null,
  fg: string
) {
  const filledBg = surface?.buttonFilledBg ?? theme.buttonFilledBg ?? '#FFFFFF'
  const outlineBorder =
    surface?.buttonOutlineBorder ?? theme.buttonOutlineBorder ?? LISTING_TILE_BORDER
  const fontSize = tile
    ? TYPOGRAPHY.caption
    : size === 'sm'
      ? TYPOGRAPHY.bodySmall
      : size === 'lg'
        ? TYPOGRAPHY.body
        : TYPOGRAPHY.bodySmall

  const paddingH = tile
    ? SPACING.xs
    : isIconOnly
      ? 0
      : size === 'sm'
        ? SPACING.sm
        : SPACING.md

  return StyleSheet.create({
    button: {
      alignSelf: 'flex-start',
      justifyContent: 'center',
      minHeight: height,
      height,
      minWidth: isIconOnly ? height : hasIconAndLabel ? (size === 'sm' ? 88 : 96) : undefined,
      paddingHorizontal: paddingH,
      borderRadius: tile ? RADIUS.sm : RADIUS.md,
      width: fullWidth ? '100%' : undefined,
      flex: fullWidth && tile ? 1 : undefined,
      flexShrink: 0,
      overflow: 'visible',
      ...(variant === 'accent'
        ? {
            backgroundColor: BUTTON_ACCENT.background,
            borderWidth: 0,
          }
        : variant === 'filled'
          ? {
              backgroundColor: filledBg,
              borderWidth: tile ? 2 : 1,
              borderColor: LISTING_TILE_BORDER,
            }
          : {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 2,
              borderColor: tile ? LISTING_TILE_BORDER : outlineBorder,
            }),
    },
    content: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      justifyContent: 'center',
      width: fullWidth ? '100%' : undefined,
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.45,
    },
    icon: {
      flexShrink: 0,
      marginRight: hasIconAndLabel ? SPACING.inlineGap : 0,
    },
    label: {
      fontSize,
      fontFamily: theme.semiBoldFont,
      fontWeight: '600',
      color: fg,
      flexShrink: 0,
      ...androidLabelStyle,
    },
    accentStroke: {
      alignSelf: 'flex-start',
      flexShrink: 0,
      overflow: 'hidden',
      borderRadius: tile ? RADIUS.sm : RADIUS.md,
      borderWidth: BUTTON_ACCENT.borderWidth,
      borderColor: BUTTON_ACCENT.border,
    },
    accentStrokeTileFull: {
      alignSelf: 'stretch',
      width: '100%',
      flex: 1,
    },
    buttonAccentInner: {
      backgroundColor: BUTTON_ACCENT.background,
      borderWidth: 0,
    },
  })
}
