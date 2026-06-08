import { useContext } from 'react'
import { View } from 'react-native'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { TYPOGRAPHY } from '../../constants/layout'
import { formatChartDateRange } from './chartFormat'

export interface ChartDateRangeProps {
  startDate?: string
  endDate?: string
  /** Optional subtitle, e.g. "Portfolio history" */
  hint?: string
}

/** Visible window label — sits under brush, above period pills */
export function ChartDateRange({ startDate, endDate, hint }: ChartDateRangeProps) {
  const { theme } = useContext(ThemeContext)
  const label = formatChartDateRange(startDate, endDate)
  if (!label) return null

  return (
    <View className="mt-2 w-full items-center">
      <Text
        style={{
          fontSize: TYPOGRAPHY.caption,
          fontFamily: theme.semiBoldFont,
          color: 'rgba(255, 255, 255, 0.75)',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
      {hint ? (
        <Text
          style={{
            fontSize: TYPOGRAPHY.label,
            fontFamily: theme.regularFont,
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            marginTop: 2,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  )
}
