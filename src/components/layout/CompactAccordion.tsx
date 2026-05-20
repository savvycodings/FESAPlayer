import { View, StyleSheet, Pressable, type ReactNode } from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, CARD_SURFACE } from '../../constants/layout'

interface CompactAccordionProps {
  title: string
  subtitle?: string
  icon?: ComponentProps<typeof Ionicons>['name']
  expanded: boolean
  onToggle: () => void
  children?: ReactNode
  headerAction?: ReactNode
}

export function CompactAccordion({
  title,
  subtitle,
  icon,
  expanded,
  onToggle,
  children,
  headerAction,
}: CompactAccordionProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        {icon ? (
          <Ionicons name={icon} size={14} color={CARD_SURFACE.textPrimary} style={styles.headerIcon} />
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerAction}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={CARD_SURFACE.textMuted}
        />
      </Pressable>
      {expanded && children ? <View style={styles.body}>{children}</View> : null}
    </View>
  )
}

function getStyles(theme: {
  textColor?: string
  semiBoldFont?: string
  regularFont?: string
  mutedForegroundColor?: string
  cardBackground?: string
  borderColor?: string
}) {
  return StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: CARD_SURFACE.border,
      borderRadius: RADIUS.md,
      backgroundColor: CARD_SURFACE.background,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      minHeight: 32,
    },
    headerIcon: {
      marginRight: SPACING.xs,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      marginRight: SPACING.xs,
    },
    title: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: CARD_SURFACE.textPrimary,
      fontWeight: '600',
    },
    subtitle: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      marginTop: 1,
    },
    body: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
      paddingHorizontal: SPACING.sm,
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.sm,
    },
  })
}
