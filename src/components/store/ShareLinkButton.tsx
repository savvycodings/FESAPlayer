import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface ShareLinkButtonProps {
  storeLink: string
}

export function ShareLinkButton({ storeLink }: ShareLinkButtonProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  const handleCopy = () => {
    // TODO: Implement clipboard copy
    // For now, show alert
    Alert.alert('Link Copied!', `Store link: ${storeLink}`)
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleCopy}
      activeOpacity={0.7}
    >
      <Ionicons
        name="link"
        size={16}
        color="rgba(255, 255, 255, 0.7)"
        style={styles.icon}
      />
      <Text style={styles.text}>Copy Store Link</Text>
      <Ionicons
        name="copy-outline"
        size={14}
        color="rgba(255, 255, 255, 0.5)"
      />
    </TouchableOpacity>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  text: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: SPACING.xs,
    letterSpacing: 0.1,
  },
})
