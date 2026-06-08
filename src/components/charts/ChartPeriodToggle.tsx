import { useContext } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import type { ChartPeriod } from './PortfolioLineChart'

const PERIODS: ChartPeriod[] = ['1M', '3M', '6M', '1Y']

export interface ChartPeriodToggleProps {
  value: ChartPeriod
  onChange: (period: ChartPeriod) => void
}

/** Period pills — uses ThemeContext colors (not NativeWind foreground tokens) */
export function ChartPeriodToggle({ value, onChange }: ChartPeriodToggleProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {PERIODS.map((period) => {
          const active = value === period
          return (
            <Pressable
              key={period}
              onPress={() => onChange(period)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{period}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const getStyles = (theme: {
  textColor?: string
  backgroundColor?: string
  semiBoldFont?: string
}) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      alignItems: 'center',
      marginTop: SPACING.xs,
      marginBottom: SPACING.xs,
    },
    track: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderRadius: RADIUS.full,
      padding: 2,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      gap: 2,
    },
    option: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.full,
      minWidth: 36,
      height: SPACING.pillHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionActive: {
      backgroundColor: theme.textColor ?? '#FFFFFF',
    },
    optionText: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.semiBoldFont,
      color: 'rgba(255, 255, 255, 0.55)',
      fontWeight: '600',
    },
    optionTextActive: {
      color: theme.backgroundColor ?? '#000000',
    },
  })
