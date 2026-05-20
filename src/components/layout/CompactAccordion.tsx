import {
  View,
  StyleSheet,
  Pressable,
  Text as RNText,
  type ReactNode,
} from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps } from 'react'
import { ThemeContext } from '../../context'
import { androidLabelStyle } from '../../utils/platformHelpers'
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
        <View style={styles.leading}>
          {icon ? (
            <View style={styles.iconSlot}>
              <Ionicons name={icon} size={16} color={CARD_SURFACE.textSecondary} />
            </View>
          ) : null}
          <View style={styles.headerText}>
            <RNText style={styles.title} numberOfLines={1}>
              {title}
            </RNText>
            {subtitle ? (
              <RNText style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </RNText>
            ) : null}
          </View>
        </View>
        {headerAction ? <View style={styles.headerAction}>{headerAction}</View> : null}
        <View style={styles.chevronSlot}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={CARD_SURFACE.textMuted}
          />
        </View>
      </Pressable>
      {expanded && children ? <View style={styles.body}>{children}</View> : null}
    </View>
  )
}

function getStyles(theme: { semiBoldFont?: string; regularFont?: string }) {
  const titleSize = TYPOGRAPHY.bodySmall
  const subtitleSize = TYPOGRAPHY.label

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
      paddingVertical: SPACING.sm,
      gap: SPACING.xs,
    },
    leading: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      minWidth: 0,
      gap: SPACING.xs,
    },
    iconSlot: {
      width: 18,
      paddingTop: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: 0,
    },
    title: {
      fontSize: titleSize,
      lineHeight: titleSize + 2,
      fontFamily: theme.semiBoldFont,
      color: CARD_SURFACE.textPrimary,
      fontWeight: '600',
      ...androidLabelStyle,
    },
    subtitle: {
      fontSize: subtitleSize,
      lineHeight: subtitleSize + 2,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      marginTop: 1,
      ...androidLabelStyle,
    },
    headerAction: {
      flexShrink: 0,
      alignSelf: 'center',
    },
    chevronSlot: {
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      alignSelf: 'center',
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
