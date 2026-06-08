import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { ThemedText } from '../ui/ThemedText'
import { ThemeContext } from '../../context'
import { PortfolioValueInline, type PortfolioHistoryPoint } from '../profile/PortfolioValueInline'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'

interface ShopHeaderProps {
  userName: string
  portfolioValue?: number
  portfolioHistory?: PortfolioHistoryPoint[]
}

export function ShopHeader({ userName, portfolioValue = 0, portfolioHistory = [] }: ShopHeaderProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.headerContainer}>
      <View style={styles.welcomeContainer}>
        <ThemedText style={styles.welcomeText}>Welcome back</ThemedText>
        <View style={styles.nameRow}>
          <View style={styles.userNameWrap}>
            <ThemedText style={styles.userNameText} numberOfLines={1}>
              {userName}
            </ThemedText>
          </View>
          <View style={styles.portfolioSlot}>
            <PortfolioValueInline
              portfolioValue={portfolioValue}
              portfolioHistory={portfolioHistory}
              variant="shop"
            />
          </View>
        </View>
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
      minWidth: 0,
    },
    welcomeText: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.55)',
      marginBottom: SPACING.xs,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      minHeight: 34,
    },
    userNameWrap: {
      flex: 1,
      minWidth: 0,
      marginRight: SPACING.sm,
    },
    userNameText: {
      fontSize: 28,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      letterSpacing: -0.4,
      lineHeight: 34,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    portfolioSlot: {
      flexShrink: 0,
      height: 34,
      justifyContent: 'center',
    },
  })
