import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, STORE_COLORS } from '../../constants/layout'

interface SafetyFilterProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function SafetyFilter({ enabled, onToggle }: SafetyFilterProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, enabled)

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onToggle(!enabled)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={enabled ? 'shield-checkmark' : 'shield-outline'}
          size={18}
          color={enabled ? STORE_COLORS.vaulted : 'rgba(255, 255, 255, 0.5)'}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Vaulted Only</Text>
        <Text style={styles.description}>
          Only show cards in SA Player vault
        </Text>
      </View>
      <View style={[styles.toggle, enabled && styles.toggleActive]}>
        <View style={[styles.toggleThumb, enabled && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  )
}

const getStyles = (theme: any, enabled: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.cardPadding,
    borderRadius: RADIUS.md,
    backgroundColor: enabled ? `${STORE_COLORS.vaulted}15` : (theme.cardBackground || '#000000'),
    borderWidth: 1,
    borderColor: enabled ? `${STORE_COLORS.vaulted}40` : 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  description: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: STORE_COLORS.vaulted,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
})
