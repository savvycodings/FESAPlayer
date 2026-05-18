import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { ThemedText } from '../ui/ThemedText'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'

interface ShopHeaderProps {
  userName: string
}

export function ShopHeader({ userName }: ShopHeaderProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.headerContainer}>
      <View style={styles.welcomeContainer}>
        <ThemedText style={styles.welcomeText}>Welcome back</ThemedText>
        <ThemedText style={styles.userNameText} numberOfLines={2}>
          {userName}
        </ThemedText>
      </View>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.lg,
      backgroundColor: theme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    welcomeContainer: {
      justifyContent: 'center',
      flex: 1,
    },
    welcomeText: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.55)',
      marginBottom: SPACING.xs,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    userNameText: {
      fontSize: 28,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      letterSpacing: -0.4,
      lineHeight: 34,
    },
  })
