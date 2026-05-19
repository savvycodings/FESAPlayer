import type { ReactNode } from 'react'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SPACING } from '../../constants/layout'

type FormScreenProps = {
  children: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
  /** Extra space above keyboard (e.g. tab bar). Default 24. */
  bottomOffset?: number
}

/**
 * Scrollable screen wrapper that keeps focused inputs visible when the keyboard opens.
 * Use for any full-screen form (Login, Edit profile, settings fields).
 */
export function FormScreen({
  children,
  contentContainerStyle,
  bottomOffset = 24,
}: FormScreenProps) {
  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      bottomOffset={bottomOffset}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: SPACING['4xl'],
  },
})
