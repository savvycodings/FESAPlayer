import { StyleSheet } from 'react-native'
import { SPACING, TYPOGRAPHY, RADIUS } from './layout'

/** Shared height for single-line fields (matches Login). */
export const FORM_INPUT_HEIGHT = 52

export function getFormFieldStyles(theme: {
  cardBackground?: string
  borderColor?: string
  textColor?: string
  mutedForegroundColor?: string
  regularFont?: string
  mediumFont?: string
}) {
  return StyleSheet.create({
    fieldWrap: {
      marginBottom: SPACING.lg,
    },
    label: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.mediumFont,
      color: theme.mutedForegroundColor,
      marginBottom: SPACING.sm,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.05)',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: SPACING.md,
      minHeight: FORM_INPUT_HEIGHT,
    },
    inputRowMultiline: {
      alignItems: 'flex-start',
      minHeight: 100,
      paddingVertical: SPACING.md,
    },
    inputIcon: {
      marginRight: SPACING.sm,
    },
    input: {
      flex: 1,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      paddingVertical: 0,
    },
    inputMultiline: {
      minHeight: 72,
      textAlignVertical: 'top',
      paddingVertical: 0,
    },
    hint: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      marginTop: SPACING.xs,
    },
  })
}
