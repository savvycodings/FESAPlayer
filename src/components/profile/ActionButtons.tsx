import { View, StyleSheet } from 'react-native'
import type { ComponentProps } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppButton } from '../ui/AppButton'
import { SPACING } from '../../constants/layout'

interface ActionButton {
  label: string
  icon: ComponentProps<typeof Ionicons>['name']
  onPress?: () => void
  variant?: 'filled' | 'outline'
}

interface ActionButtonsProps {
  buttons: ActionButton[]
}

export function ActionButtons({ buttons }: ActionButtonsProps) {
  return (
    <View style={styles.container}>
      {buttons.map((button, index) => (
        <AppButton
          key={`${button.label}-${index}`}
          variant={button.variant ?? (index === 0 ? 'filled' : 'outline')}
          size="sm"
          icon={button.icon}
          label={button.label}
          onPress={button.onPress}
          style={styles.buttonFlex}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  buttonFlex: {
    flex: 1,
    minWidth: 0,
  },
})
