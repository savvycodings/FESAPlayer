import { StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING } from '../../constants/layout'

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
      style={styles.iconButton}
      onPress={handleCopy}
      activeOpacity={0.6}
      accessibilityLabel="Copy store link"
    >
      <Ionicons
        name="link"
        size={22}
        color="rgba(255, 255, 255, 0.6)"
      />
    </TouchableOpacity>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  iconButton: {
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
})
