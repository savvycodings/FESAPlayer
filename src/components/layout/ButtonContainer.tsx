import { View, StyleSheet, ViewStyle } from 'react-native'

interface ButtonContainerProps {
  children: React.ReactNode
  style?: ViewStyle
  gap?: number
}

/**
 * Reusable button container component (like settings screen)
 * Use this to group buttons consistently
 */
export function ButtonContainer({ children, style, gap }: ButtonContainerProps) {
  const styles = getStyles(gap)

  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  )
}

const getStyles = (gap?: number) => StyleSheet.create({
  container: {
    marginBottom: 20,
    ...(gap !== undefined && { gap }),
  },
})
