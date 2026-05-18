import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

interface EditBadgeProps {
  /** Callback when the edit badge is pressed (optional – if not provided, badge is still visible but not pressable) */
  onPress?: () => void
  /** Size of the badge circle. Default 28. */
  size?: number
  /** Icon size inside the circle. Default 14. */
  iconSize?: number
}

/**
 * Small edit (pencil) badge to overlay on profile/avatar circles so users see they can change the image.
 * Place at bottom-right of the avatar container (e.g. position: absolute, bottom: 0, right: 0).
 */
export function EditBadge({ onPress, size = 28, iconSize = 14 }: EditBadgeProps) {
  const Wrapper = onPress ? TouchableOpacity : View
  const wrapperProps = onPress
    ? { onPress, activeOpacity: 0.8 }
    : {}

  return (
    <Wrapper
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}
      {...wrapperProps}
      accessibilityLabel="Edit photo"
    >
      <Ionicons name="pencil" size={iconSize} color="#FFFFFF" />
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    zIndex: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
