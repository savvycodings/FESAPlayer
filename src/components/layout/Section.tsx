import { View, StyleSheet, ViewStyle } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import { TouchableOpacity } from 'react-native'
import { ThemeContext } from '../../context'

interface SectionProps {
  title: string
  showSeeAll?: boolean
  seeAllText?: string
  onSeeAllPress?: () => void
  children: React.ReactNode
  style?: ViewStyle
}

export function Section({ 
  title, 
  showSeeAll = false,
  seeAllText = 'See all',
  onSeeAllPress,
  children,
  style 
}: SectionProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showSeeAll && (
          <TouchableOpacity onPress={onSeeAllPress} activeOpacity={0.6}>
            <Text style={styles.seeAll}>{seeAllText}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: SPACING.sectionGap,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sectionTitleBottom,
  },
  title: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    fontWeight: '600',
    color: theme.textColor,
    letterSpacing: -0.3,
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
