import { View, StyleSheet, ViewStyle } from 'react-native'
import { useContext } from 'react'
import { ThemedText } from '../ui/ThemedText'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import { TouchableOpacity } from 'react-native'
import { ThemeContext } from '../../context'

interface SectionProps {
  title: string
  showSeeAll?: boolean
  seeAllText?: string
  onSeeAllPress?: () => void
  rightContent?: React.ReactNode
  children: React.ReactNode
  style?: ViewStyle
  /** Tighter vertical rhythm for info-dense screens */
  compact?: boolean
}

export function Section({ 
  title, 
  showSeeAll = false,
  seeAllText = 'See all',
  onSeeAllPress,
  rightContent,
  children,
  style,
  compact = true,
}: SectionProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, compact)
  const hideHeader = title === 'In Search Of' || title === 'Reviews'
  
  return (
    <View style={[styles.container, style]}>
      {!hideHeader && (
        <View style={styles.header}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <View style={styles.headerRight}>
            {rightContent}
            {showSeeAll && (
              <TouchableOpacity onPress={onSeeAllPress} activeOpacity={0.6}>
                <ThemedText style={styles.seeAll}>{seeAllText}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const getStyles = (theme: any, compact: boolean) => StyleSheet.create({
  container: {
    marginTop: compact ? SPACING.stackGap : SPACING.sectionGap,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sectionTitleBottom,
    minHeight: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    letterSpacing: 0.05,
    lineHeight: TYPOGRAPHY.body * 1.2,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.1,
  },
  content: {
    // Content spacing handled by children
  },
})
