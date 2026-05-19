import { useContext, type ReactNode } from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

type FormModalProps = {
  visible: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Footer actions (Save / Submit) — stays above keyboard when possible */
  footer?: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
  maxHeightPercent?: number
}

/**
 * Standard modal shell for forms: safe header, keyboard-aware scroll body, optional footer.
 */
export function FormModal({
  visible,
  title,
  onClose,
  children,
  footer,
  contentContainerStyle,
  maxHeightPercent = 0.92,
}: FormModalProps) {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme, insets.top, maxHeightPercent)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close modal" />
        <View style={styles.sheet}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.sm) + SPACING.md }]}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bottomOffset={footer ? 80 : 24}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </KeyboardAwareScrollView>

          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any, topInset: number, maxHeightPercent: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      maxHeight: `${maxHeightPercent * 100}%`,
      backgroundColor: theme.backgroundColor,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.containerPadding * 2,
      paddingBottom: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    title: {
      flex: 1,
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      marginRight: SPACING.md,
    },
    closeButton: {
      padding: SPACING.xs,
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingHorizontal: SPACING.containerPadding * 2,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING['2xl'],
    },
    footer: {
      paddingHorizontal: SPACING.containerPadding * 2,
      paddingTop: SPACING.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
      backgroundColor: theme.backgroundColor,
    },
  })
