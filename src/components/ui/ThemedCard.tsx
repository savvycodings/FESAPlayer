import { View, StyleSheet, ViewStyle } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../../context'
import { SPACING, RADIUS } from '../../constants/layout'

interface ThemedCardProps {
  children: React.ReactNode
  style?: ViewStyle
  padding?: number
  variant?: 'default' | 'elevated' | 'outlined'
}

/**
 * Reusable card component that uses theme colors
 * Use this instead of duplicating card styles everywhere
 */
export function ThemedCard({ 
  children, 
  style, 
  padding = SPACING.sm,
  variant = 'default'
}: ThemedCardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, variant)

  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  )
}

const getStyles = (theme: any, variant: string) => StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground || '#000000', // Solid black cards for contrast
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...(variant === 'elevated' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
})
