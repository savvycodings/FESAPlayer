import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { useContext } from 'react'
import { Text } from './text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface ThemedButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  disabled?: boolean
}

/**
 * Reusable button component that uses theme colors
 * Use this instead of duplicating button styles everywhere
 */
export function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  textStyle,
  disabled = false,
}: ThemedButtonProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, variant, size)

  return (
    <TouchableOpacity
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  )
}

const getStyles = (theme: any, variant: string, size: string) => StyleSheet.create({
  button: {
    paddingVertical: size === 'sm' ? SPACING.xs : size === 'lg' ? SPACING.md : SPACING.sm,
    paddingHorizontal: size === 'sm' ? SPACING.sm : size === 'lg' ? SPACING.lg : SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...(variant === 'primary' && {
      backgroundColor: theme.tintColor || '#0281ff',
    }),
    ...(variant === 'secondary' && {
      backgroundColor: theme.buttonBackground || 'rgba(0, 0, 0, 0.8)',
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.2)',
    }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.2)',
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: size === 'sm' ? TYPOGRAPHY.caption : size === 'lg' ? TYPOGRAPHY.body : TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
    color: variant === 'primary' 
      ? (theme.tintTextColor || '#FFFFFF')
      : theme.textColor,
  },
})
