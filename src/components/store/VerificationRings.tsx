import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../../context'
import { STORE_COLORS, VERIFICATION_THRESHOLDS } from '../../constants/layout'

interface VerificationRingsProps {
  salesCount: number
  size?: number
}

export function VerificationRings({ salesCount, size = 100 }: VerificationRingsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, size)

  // Determine ring color based on sales count
  const getRingColor = () => {
    if (salesCount >= VERIFICATION_THRESHOLDS.diamond) return STORE_COLORS.diamond
    if (salesCount >= VERIFICATION_THRESHOLDS.platinum) return STORE_COLORS.platinum
    if (salesCount >= VERIFICATION_THRESHOLDS.gold) return STORE_COLORS.gold
    if (salesCount >= VERIFICATION_THRESHOLDS.silver) return STORE_COLORS.silver
    if (salesCount >= VERIFICATION_THRESHOLDS.bronze) return STORE_COLORS.bronze
    return 'transparent' // No ring if below threshold
  }

  const ringColor = getRingColor()
  const hasRing = ringColor !== 'transparent'

  if (!hasRing) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: ringColor }]} />
      <View style={[styles.ringInner, { borderColor: ringColor }]} />
    </View>
  )
}

const getStyles = (theme: any, size: number) => StyleSheet.create({
  container: {
    position: 'absolute',
    width: size + 8,
    height: size + 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: size + 8,
    height: size + 8,
    borderRadius: (size + 8) / 2,
    borderWidth: 3,
    opacity: 0.8,
  },
  ringInner: {
    position: 'absolute',
    width: size + 4,
    height: size + 4,
    borderRadius: (size + 4) / 2,
    borderWidth: 2,
    opacity: 0.6,
  },
})
