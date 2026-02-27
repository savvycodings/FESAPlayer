import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
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
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.userNameText}>{userName}</Text>
      </View>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.headerPadding,
    paddingBottom: SPACING.headerPadding,
    backgroundColor: theme.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  welcomeContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  userNameText: {
    fontSize: 18,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
})
