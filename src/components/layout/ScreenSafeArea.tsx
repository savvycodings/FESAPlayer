import { type ReactNode } from 'react'
import { StyleSheet, type ViewStyle } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'

type ScreenSafeAreaProps = {
  children: ReactNode
  edges?: Edge[]
  style?: ViewStyle
}

/** Standard safe-area wrapper for full screens (not needed inside tab stacks with headers). */
export function ScreenSafeArea({
  children,
  edges = ['top', 'left', 'right'],
  style,
}: ScreenSafeAreaProps) {
  return (
    <SafeAreaView style={[styles.flex, style]} edges={edges}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
})
