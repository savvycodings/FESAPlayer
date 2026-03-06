import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, RADIUS } from '../../constants/layout'

interface SafetyFilterProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  /** When true, removes bottom margin (e.g. when used in a section header row) */
  compact?: boolean
}

export function SafetyFilter({ enabled, onToggle, compact }: SafetyFilterProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, enabled, compact)

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.switch, enabled && styles.switchActive]}
        onPress={() => onToggle(!enabled)}
        activeOpacity={0.8}
        accessibilityLabel={enabled ? 'Verified only on' : 'Verified only off'}
      >
        <View style={[styles.switchThumb, enabled && styles.switchThumbActive]}>
          <Ionicons
            name="shield-checkmark"
            size={14}
            color="#000000"
          />
        </View>
      </TouchableOpacity>
    </View>
  )
}

const getStyles = (theme: any, enabled: boolean, compact?: boolean) => StyleSheet.create({
  container: {
    marginBottom: compact ? 0 : SPACING.lg,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchActive: {
    backgroundColor: (theme.tintColor || '#73EC8B') + '99',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
})
