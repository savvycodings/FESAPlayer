import { useContext, useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { ThemeContext } from '../../context'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import { PriceChart } from '../profile/PriceChart'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { DOMAIN } from '../../../constants'

const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

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
}

export function CardPriceSection({ cardId, displayPriceZar = 0, days = 90, onMarketPriceUsd }: Props) {
  const { theme } = useContext(ThemeContext)
  const tintColor = theme.tintColor || '#73EC8B'
  const styles = getStyles(theme)

  const [chartLoading, setChartLoading] = useState(true)
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([])
  const [chartDates, setChartDates] = useState<string[]>([])
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([])
  const [marketUsd, setMarketUsd] = useState<number | null>(null)
  const [ebayUsd, setEbayUsd] = useState<number | null>(null)

  useEffect(() => {
    if (!cardId?.trim()) return
    let cancelled = false
    const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN

    setChartLoading(true)
    fetch(`${baseUrl}/pokedata/card/${encodeURIComponent(cardId.trim())}/price-history?days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const history = (data.history || []) as { date?: string; marketPrice?: number | null; ebayLastSold?: number | null }[]
        const rows: HistoryRow[] = history.map((h) => ({
          date: h.date ? String(h.date).slice(0, 10) : '',
          marketPrice: h.marketPrice != null ? Number(h.marketPrice) : null,
          ebayLastSold: h.ebayLastSold != null ? Number(h.ebayLastSold) : null,
        }))
        setHistoryRows(rows)
        if (rows.length === 0) {
          const flat = displayPriceZar > 0 ? [{ x: 0, y: displayPriceZar }, { x: 1, y: displayPriceZar }] : []
          setChartData(flat)
          setChartDates([])
        } else {
          setChartData(
            rows.map((h, i) => ({
              x: i,
              y: h.marketPrice != null ? h.marketPrice * USD_TO_ZAR : displayPriceZar,
            })),
          )
          setChartDates(rows.map((h) => h.date))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryRows([])
          setChartData(displayPriceZar > 0 ? [{ x: 0, y: displayPriceZar }, { x: 1, y: displayPriceZar }] : [])
          setChartDates([])
        }
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false)
      })

    fetch(`${baseUrl}/pokedata/card/${encodeURIComponent(cardId.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const mp = data?.marketPrice ?? data?.market_price
        const ep = data?.ebayLastSold ?? data?.ebay_last_sold
        const marketNum = mp != null && mp !== '' ? parseFloat(String(mp)) : null
        const ebayNum = ep != null && ep !== '' ? parseFloat(String(ep)) : null
        setMarketUsd(Number.isFinite(marketNum) ? marketNum : null)
        setEbayUsd(Number.isFinite(ebayNum) ? ebayNum : null)
        onMarketPriceUsd?.(Number.isFinite(marketNum) ? marketNum : null)
      })
      .catch(() => {
        if (!cancelled) {
          setMarketUsd(null)
          setEbayUsd(null)
          onMarketPriceUsd?.(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [cardId, displayPriceZar, days, onMarketPriceUsd])

  const currentValueData =
    chartData.length > 0
      ? chartData
      : displayPriceZar > 0
        ? [{ x: 0, y: displayPriceZar }, { x: 1, y: displayPriceZar }]
        : []

  const formatZar = (usd: number | null) => {
    if (usd == null) return '—'
    return `R${Math.round(usd * USD_TO_ZAR).toLocaleString('en-ZA')}`
  }

  return (
    <View style={styles.wrap}>
      {(marketUsd != null || ebayUsd != null) && (
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            {marketUsd != null && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Market</Text>
                <Text style={styles.priceValue}>{formatZar(marketUsd)}</Text>
              </View>
            )}
            {ebayUsd != null && ebayUsd > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>eBay last sold</Text>
                <Text style={styles.priceValue}>{formatZar(ebayUsd)}</Text>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {chartLoading ? (
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={tintColor} />
              <Text style={styles.muted}>Loading price history…</Text>
            </View>
          </CardContent>
        </Card>
      ) : currentValueData.length > 0 ? (
        <PriceChart
          data={currentValueData}
          dates={chartDates.length > 0 ? chartDates : undefined}
          title="Market value"
          subtitle={chartDates.length >= 2 ? `${chartDates.length} points` : 'Current'}
          valuePrefix="R"
          color={tintColor}
          height={160}
        />
      ) : null}

      {historyRows.length > 0 && (
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
      )}
    </View>
  )
}

const getStyles = (theme: { textColor?: string; cardBackground?: string }) =>
  StyleSheet.create({
    wrap: { gap: SPACING.md },
    card: {
      backgroundColor: theme.cardBackground || '#000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardContent: { padding: SPACING.md },
    priceRow: { marginBottom: SPACING.sm },
    priceLabel: { fontSize: TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.55)' },
    priceValue: { fontSize: TYPOGRAPHY.h3, fontWeight: '600', color: theme.textColor || '#fff' },
    loading: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
    muted: { fontSize: TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.5)' },
    tableTitle: { fontSize: TYPOGRAPHY.body, fontWeight: '600', color: theme.textColor || '#fff', marginBottom: SPACING.sm },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: SPACING.xs },
    tableRow: { flexDirection: 'row', paddingVertical: SPACING.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
    tableCell: { fontSize: TYPOGRAPHY.caption, color: theme.textColor || '#fff' },
    tableHead: { color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
    colDate: { flex: 1.2 },
    colNum: { flex: 1, textAlign: 'right' },
  })
