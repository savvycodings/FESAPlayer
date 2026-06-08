import { useContext } from 'react'
import { View, type ViewStyle } from 'react-native'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { useChartTheme } from './chartTheme'

export interface ChartTooltipProps {
  dateLabel: string
  valueLabel: string
  accentColor?: string
  style?: ViewStyle
}

export function ChartTooltip({ dateLabel, valueLabel, accentColor, style }: ChartTooltipProps) {
  const { theme } = useContext(ThemeContext)
  const tokens = useChartTheme(accentColor)

  return (
    <View
      style={[
        {
          position: 'absolute',
          zIndex: 10,
          minWidth: 80,
          alignItems: 'center',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: tokens.tooltipBg,
          borderWidth: 1,
          borderColor: tokens.tooltipBorder,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: 10,
          fontFamily: theme.regularFont,
          color: tokens.tooltipMuted,
          marginBottom: 2,
        }}
      >
        {dateLabel}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontFamily: theme.semiBoldFont,
          fontWeight: '600',
          color: tokens.linePrimary,
        }}
      >
        {valueLabel}
      </Text>
    </View>
  )
}
