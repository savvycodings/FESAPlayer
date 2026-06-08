import { useContext } from 'react'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { Text } from './text'

export const CHANGE_PILL_COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  positiveBg: 'rgba(16, 185, 129, 0.15)',
  negativeBg: 'rgba(239, 68, 68, 0.15)',
} as const

export type ChangePercentPillProps = {
  change: number
  changePercent: string | number
  /** When false, renders nothing (default: hide if change === 0) */
  visible?: boolean
  iconSize?: number
  style?: StyleProp<ViewStyle>
}

export function ChangePercentPill({
  change,
  changePercent,
  visible,
  iconSize = 10,
  style,
}: ChangePercentPillProps) {
  const { theme } = useContext(ThemeContext)
  const show = visible ?? change !== 0
  if (!show) return null

  const positive = change >= 0
  const pct =
    typeof changePercent === 'number'
      ? Math.abs(changePercent).toFixed(1)
      : String(Math.abs(parseFloat(String(changePercent))))

  return (
    <View
      style={[
        styles.pill,
        positive ? styles.positive : styles.negative,
        style,
      ]}
    >
      <Ionicons
        name={positive ? 'arrow-up' : 'arrow-down'}
        size={iconSize}
        color={positive ? CHANGE_PILL_COLORS.positive : CHANGE_PILL_COLORS.negative}
      />
      <Text
        style={[
          styles.label,
          { fontFamily: theme.semiBoldFont },
          positive ? styles.labelPositive : styles.labelNegative,
        ]}
      >
        {pct}%
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: SPACING.pillHeight,
    paddingHorizontal: SPACING.pillPaddingH,
    borderRadius: RADIUS.full,
  },
  positive: {
    backgroundColor: CHANGE_PILL_COLORS.positiveBg,
  },
  negative: {
    backgroundColor: CHANGE_PILL_COLORS.negativeBg,
  },
  label: {
    fontSize: TYPOGRAPHY.label,
    lineHeight: TYPOGRAPHY.label + 2,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  labelPositive: {
    color: CHANGE_PILL_COLORS.positive,
  },
  labelNegative: {
    color: CHANGE_PILL_COLORS.negative,
  },
})
