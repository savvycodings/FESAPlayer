import { useContext, useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import { ChartBrushLayout } from '../charts/ChartBrushLayout'
import { SPACING, TYPOGRAPHY, RADIUS, PROFILE_CHART_ACCENT } from '../../constants/layout'
import { loadCardPriceBundle } from '../../lib/cardPrices'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type HistoryRow = {
  date: string
  marketPrice: number | null
  ebayLastSold: number | null
}

type Props = {
  cardId: string
  displayPriceZar?: number
  days?: number
  onMarketPriceUsd?: (usd: number | null) => void
  /** When set, show a compact listed-price tile (store listings) */
  listedPriceZar?: number
  isListing?: boolean
}

export function CardPriceSection({
  cardId,
  displayPriceZar = 0,
  days = 90,
  onMarketPriceUsd,
  listedPriceZar,
  isListing = false,
}: Props) {
  const { theme } = useContext(ThemeContext)
  const accent = PROFILE_CHART_ACCENT
  const styles = getStyles(theme, accent)

  const [chartLoading, setChartLoading] = useState(true)
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([])
  const [chartDates, setChartDates] = useState<string[]>([])
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([])
  const [marketUsd, setMarketUsd] = useState<number | null>(null)
  const [ebayUsd, setEbayUsd] = useState<number | null>(null)

  useEffect(() => {
    if (!cardId?.trim()) return
    let cancelled = false

    setChartLoading(true)
    loadCardPriceBundle(cardId.trim(), { days, fallbackZar: displayPriceZar })
      .then(({ lookup, history, chartData: series, chartDates: dates }) => {
        if (cancelled) return
        setHistoryRows(history)
        setChartData(series)
        setChartDates(dates)
        setMarketUsd(lookup?.marketPrice ?? null)
        setEbayUsd(lookup?.ebayLastSold ?? null)
        onMarketPriceUsd?.(lookup?.marketPrice ?? null)
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryRows([])
          setChartData(
            displayPriceZar > 0
              ? [
                  { x: 0, y: displayPriceZar },
                  { x: 1, y: displayPriceZar },
                ]
              : [],
          )
          setChartDates([])
          setMarketUsd(null)
          setEbayUsd(null)
          onMarketPriceUsd?.(null)
        }
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cardId, displayPriceZar, days, onMarketPriceUsd])

  const chartSeries =
    chartData.length > 0
      ? chartData
      : displayPriceZar > 0
        ? [
            { x: 0, y: displayPriceZar },
            { x: 1, y: displayPriceZar },
          ]
        : []

  const formatZar = (usd: number | null) => {
    if (usd == null) return '—'
    return `R${Math.round(usd * USD_TO_ZAR).toLocaleString('en-ZA')}`
  }

  const formatZarAmount = (zar: number) =>
    `R${zar.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const showListed = isListing && listedPriceZar != null && listedPriceZar > 0
  const showMarket = marketUsd != null
  const showEbay = ebayUsd != null && ebayUsd > 0
  const showPriceTiles = showListed || showMarket || showEbay

  const hasPriceHistory = chartDates.length >= 4 && chartSeries.length >= 4

  return (
    <View style={styles.wrap}>
      {showPriceTiles ? (
        <View style={styles.priceRow}>
          {showListed ? (
            <View style={styles.priceTile}>
              <View style={styles.priceIconBox}>
                <Ionicons name="pricetag-outline" size={14} color={accent} />
              </View>
              <View style={styles.priceTextCol}>
                <Text style={styles.priceLabel}>Listed</Text>
                <Text style={styles.priceValue}>{formatZarAmount(listedPriceZar!)}</Text>
              </View>
            </View>
          ) : null}
          {showMarket ? (
            <View style={styles.priceTile}>
              <View style={styles.priceIconBox}>
                <Ionicons name="cash-outline" size={14} color={accent} />
              </View>
              <View style={styles.priceTextCol}>
                <Text style={styles.priceLabel}>Market</Text>
                <Text style={styles.priceValue}>{formatZar(marketUsd)}</Text>
              </View>
            </View>
          ) : null}
          {showEbay ? (
            <View style={styles.priceTile}>
              <View style={styles.priceIconBox}>
                <Ionicons name="pricetag-outline" size={14} color={accent} />
              </View>
              <View style={styles.priceTextCol}>
                <Text style={styles.priceLabel}>eBay sold</Text>
                <Text style={styles.priceValue}>{formatZar(ebayUsd)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {chartLoading ? (
        <View style={styles.chartLoading}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={styles.muted}>Loading price history…</Text>
        </View>
      ) : chartSeries.length > 0 ? (
        <ChartBrushLayout
          data={chartSeries}
          dates={chartDates.length > 0 ? chartDates : undefined}
          accentColor={accent}
          mainChartHeight={150}
          brushHeight={56}
          compact
          maxChartWidth={SCREEN_WIDTH - SPACING.containerPadding * 2}
          enabled={hasPriceHistory}
        />
      ) : null}

      {historyRows.length > 0 ? (
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text style={styles.tableTitle}>Price history</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHead, styles.colDate]}>Date</Text>
              <Text style={[styles.tableCell, styles.tableHead, styles.colNum]}>Market</Text>
              <Text style={[styles.tableCell, styles.tableHead, styles.colNum]}>eBay</Text>
            </View>
            {[...historyRows].reverse().slice(0, 30).map((row) => (
              <View key={row.date} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDate]}>{row.date}</Text>
                <Text style={[styles.tableCell, styles.colNum]}>{formatZar(row.marketPrice)}</Text>
                <Text style={[styles.tableCell, styles.colNum]}>{formatZar(row.ebayLastSold)}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </View>
  )
}

const getStyles = (theme: { textColor?: string; cardBackground?: string }, accent: string) =>
  StyleSheet.create({
    wrap: { gap: SPACING.md },
    priceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    priceTile: {
      flex: 1,
      minWidth: '46%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: hexToRgba(accent, 0.1),
      borderWidth: 1,
      borderColor: hexToRgba(accent, 0.22),
      gap: SPACING.sm,
    },
    priceIconBox: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.sm,
      backgroundColor: hexToRgba(accent, 0.18),
      justifyContent: 'center',
      alignItems: 'center',
    },
    priceTextCol: { flex: 1, minWidth: 0 },
    priceLabel: {
      fontSize: TYPOGRAPHY.label,
      color: 'rgba(255,255,255,0.55)',
      marginBottom: 2,
    },
    priceValue: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: '600',
      color: accent,
      letterSpacing: -0.2,
    },
    chartLoading: {
      alignItems: 'center',
      paddingVertical: SPACING.lg,
      gap: SPACING.sm,
    },
    muted: { fontSize: TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.5)' },
    card: {
      backgroundColor: theme.cardBackground || '#000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardContent: { padding: SPACING.cardPadding },
    tableTitle: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: '600',
      color: theme.textColor || '#fff',
      marginBottom: SPACING.sm,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
      paddingBottom: SPACING.xs,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: SPACING.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    tableCell: { fontSize: TYPOGRAPHY.caption, color: theme.textColor || '#fff' },
    tableHead: { color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
    colDate: { flex: 1.2 },
    colNum: { flex: 1, textAlign: 'right' },
  })
