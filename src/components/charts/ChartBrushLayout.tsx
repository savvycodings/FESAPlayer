import { useContext, useEffect, useMemo, useState } from 'react'
import { View, LayoutChangeEvent } from 'react-native'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { cn } from '@/src/utils'
import { PROFILE_CHART_ACCENT } from '../../constants/layout'
import {
  PortfolioLineChart,
  type ChartDataPoint,
  type ChartPeriod,
} from './PortfolioLineChart'
import { ChartBrush } from './ChartBrush'
import { ChartPeriodToggle } from './ChartPeriodToggle'
import { CHART_LAYOUT } from './chartTheme'
import { formatChartDateShort, getChartTickIndices } from './chartFormat'
import { indexToX } from './chartBrushUtils'
import {
  defaultBrushSelection,
  remapChartDataSlice,
  sliceBrushData,
  type BrushSelection,
} from './chartBrushUtils'

const MIN_BRUSH_POINTS = 4
const BRUSH_PAD = 4

export interface ChartBrushLayoutState {
  selection: BrushSelection
  onBrushSelectionChange: (selection: BrushSelection) => void
  visibleData: ChartDataPoint[]
  visibleDates: string[] | undefined
  xDomainSlotCount: number
}

export interface ChartBrushLayoutProps {
  data: ChartDataPoint[]
  dates?: string[]
  enabled: boolean
  brushHeight?: number
  mainChartHeight?: number
  period?: ChartPeriod
  onPeriodChange?: (period: ChartPeriod) => void
  showPeriodToggle?: boolean
  accentColor?: string
  maxChartWidth?: number
  roundYAxisThousands?: boolean
  compact?: boolean
  className?: string
}

export function ChartBrushLayout({
  data,
  dates,
  enabled,
  brushHeight = CHART_LAYOUT.brushHeight,
  mainChartHeight = CHART_LAYOUT.mainHeight,
  period = '1M',
  onPeriodChange,
  showPeriodToggle = false,
  accentColor = PROFILE_CHART_ACCENT,
  maxChartWidth,
  roundYAxisThousands = false,
  compact = false,
  className,
}: ChartBrushLayoutProps) {
  const { theme } = useContext(ThemeContext)
  const [selection, setSelection] = useState<BrushSelection>(() => defaultBrushSelection(data.length))
  const [stripWidth, setStripWidth] = useState(0)

  useEffect(() => {
    setSelection(defaultBrushSelection(data.length))
  }, [data, dates, period])

  const layout = useMemo<ChartBrushLayoutState>(() => {
    const visibleData = enabled ? remapChartDataSlice(data, selection) : data
    const visibleDates = enabled ? sliceBrushData(dates, selection) : dates
    return {
      selection,
      onBrushSelectionChange: setSelection,
      visibleData,
      visibleDates,
      xDomainSlotCount: data.length,
    }
  }, [data, dates, selection, enabled])

  const chartProps = {
    period,
    accentColor,
    maxChartWidth,
    roundYAxisThousands,
    compact,
  }

  const showBrush = enabled && data.length >= MIN_BRUSH_POINTS
  const brushGraphWidth = Math.max(0, stripWidth - BRUSH_PAD * 2)

  const brushAxisTicks = useMemo(() => {
    if (!dates?.length) return []
    return getChartTickIndices(data.length, 4).map((index) => ({
      index,
      label: formatChartDateShort(dates[index]),
    }))
  }, [dates, data.length])

  const onStripLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0) setStripWidth(w)
  }

  return (
    <View className={cn('w-full self-stretch', className)}>
      <PortfolioLineChart
        data={showBrush ? layout.visibleData : data}
        dates={showBrush ? layout.visibleDates : dates}
        height={mainChartHeight}
        variant="default"
        framed
        showXAxis={!showBrush}
        {...chartProps}
      />

      {showBrush ? (
        <View className="mt-2 w-full border-t border-white/10" onLayout={onStripLayout}>
          {brushAxisTicks.length > 0 && brushGraphWidth > 0 ? (
            <View style={{ height: 14, marginTop: 6, marginBottom: 4, position: 'relative' }}>
              {brushAxisTicks.map((tick) => {
                const x = indexToX(tick.index, data.length, brushGraphWidth, BRUSH_PAD)
                return (
                  <Text
                    key={tick.index}
                    style={{
                      position: 'absolute',
                      left: Math.max(0, x - 22),
                      width: 44,
                      fontSize: 10,
                      fontFamily: theme.regularFont,
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center',
                    }}
                  >
                    {tick.label}
                  </Text>
                )
              })}
            </View>
          ) : null}

          <View style={{ height: brushHeight, position: 'relative' }}>
            <PortfolioLineChart
              data={data.map((p, i) => ({ x: i, y: p.y }))}
              dates={dates}
              height={brushHeight}
              variant="brush"
              framed={false}
              interactive={false}
              showXAxis={false}
              accentColor={accentColor}
              period={period}
              maxChartWidth={maxChartWidth}
            />
            {brushGraphWidth > 0 ? (
              <ChartBrush
                dataLength={data.length}
                selection={selection}
                onSelectionChange={setSelection}
                accentColor={accentColor}
                height={brushHeight}
                graphWidth={brushGraphWidth}
                paddingLeft={BRUSH_PAD}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {showPeriodToggle && onPeriodChange ? (
        <ChartPeriodToggle value={period} onChange={onPeriodChange} />
      ) : null}
    </View>
  )
}
