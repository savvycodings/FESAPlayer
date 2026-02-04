import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface ActionButton {
  label: string
  icon: string
  onPress?: () => void
}

interface ActionButtonsProps {
  buttons: ActionButton[]
}

export function ActionButtons({ buttons }: ActionButtonsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {buttons.map((button, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          activeOpacity={0.7}
          onPress={button.onPress}
        >
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={button.icon as any}
                size={20}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.buttonLabel}>{button.label}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    backgroundColor: theme.buttonBackground || 'rgba(0, 0, 0, 0.8)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  buttonLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    textAlign: 'center',
  },
})
