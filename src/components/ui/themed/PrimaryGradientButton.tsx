import { useContext } from 'react'
import { Pressable, StyleSheet, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '../primitives/text'
import { ThemeContext } from '../../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../../constants/layout'
import { getButtonGradientColors } from '../../../utils/buttonGradients'

type PrimaryGradientButtonProps = {
  title: string
  onPress: () => void
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
}

export function PrimaryGradientButton({
  title,
  onPress,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityLabel,
}: PrimaryGradientButtonProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, fullWidth)

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <LinearGradient
        colors={getButtonGradientColors(theme)}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  )
}

const getStyles = (theme: any, fullWidth: boolean) =>
  StyleSheet.create({
    button: {
      width: fullWidth ? '100%' : undefined,
      borderRadius: RADIUS.full,
      overflow: 'hidden',
    },
    buttonPressed: {
      opacity: 0.9,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    gradient: {
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.boldFont,
      color: theme.tintTextColor || '#fff',
    },
  })
