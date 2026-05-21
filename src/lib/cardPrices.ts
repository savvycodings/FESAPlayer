/**
 * Card pricing + history — same 48h DB cache as web admin (card_prices / card_price_history).
 * GET /pokedata/card/:id refreshes from Pokedata only when stale; then history reflects updated rows.
 */
import { DOMAIN } from '../../constants'

const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

/** Max stale cards to refresh per profile load (server caps at 30). */
export const PROFILE_REFRESH_STALE_LIMIT = 25

export type CardPriceLookup = {
  id: string
  marketPrice: number | null
  ebayLastSold: number | null
  fromCache?: boolean
  lastFetchedAt?: string
  cardName?: string | null
  setName?: string | null
  imageUrl?: string | null
}

export type CardPriceHistoryPoint = {
  date: string
  marketPrice: number | null
  ebayLastSold: number | null
}

function apiBase(): string {
  const d = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
  if (!d) throw new Error('DOMAIN is not configured')
  return d
}

function parseUsd(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

/** Latest price from shared cache (refreshes via Pokedata when >48h old). */
export async function fetchCardPriceLookup(cardId: string): Promise<CardPriceLookup | null> {
  const id = cardId?.trim()
  if (!id) return null
  const res = await fetch(`${apiBase()}/pokedata/card/${encodeURIComponent(id)}`)
  if (!res.ok) return null
  const data = await res.json()
  return {
    id: String(data.id ?? id),
    marketPrice: parseUsd(data.marketPrice ?? data.market_price),
    ebayLastSold: parseUsd(data.ebayLastSold ?? data.ebay_last_sold),
    fromCache: data.fromCache === true,
    lastFetchedAt: data.lastFetchedAt,
    cardName: data.cardName ?? null,
    setName: data.setName ?? null,
    imageUrl: data.imageUrl ?? null,
  }
}

/** Daily history from card_price_history (call after fetchCardPriceLookup when data may be stale). */
export async function fetchCardPriceHistory(
  cardId: string,
  days = 90,
): Promise<CardPriceHistoryPoint[]> {
  const id = cardId?.trim()
  if (!id) return []
  const res = await fetch(
    `${apiBase()}/pokedata/card/${encodeURIComponent(id)}/price-history?days=${days}`,
  )
  if (!res.ok) return []
  const data = await res.json()
  const history = (data.history || []) as {
    date?: string
    marketPrice?: number | null
    ebayLastSold?: number | null
  }[]
  return history.map((h) => ({
    date: h.date ? String(h.date).slice(0, 10) : '',
    marketPrice: h.marketPrice != null ? Number(h.marketPrice) : null,
    ebayLastSold: h.ebayLastSold != null ? Number(h.ebayLastSold) : null,
  }))
}

export function historyToChartSeries(
  rows: CardPriceHistoryPoint[],
  fallbackZar = 0,
): { chartData: { x: number; y: number }[]; chartDates: string[] } {
  if (rows.length === 0) {
    if (fallbackZar > 0) {
      return {
        chartData: [
          { x: 0, y: fallbackZar },
          { x: 1, y: fallbackZar },
        ],
        chartDates: [],
      }
    }
    return { chartData: [], chartDates: [] }
  }
  return {
    chartData: rows.map((h, i) => ({
      x: i,
      y: h.marketPrice != null ? h.marketPrice * USD_TO_ZAR : fallbackZar,
    })),
    chartDates: rows.map((h) => h.date),
  }
}

/** Load lookup then history so chart includes today's point after a stale refresh. */
export async function loadCardPriceBundle(
  cardId: string,
  options?: { days?: number; fallbackZar?: number },
): Promise<{
  lookup: CardPriceLookup | null
  history: CardPriceHistoryPoint[]
  chartData: { x: number; y: number }[]
  chartDates: string[]
}> {
  const lookup = await fetchCardPriceLookup(cardId)
  const history = await fetchCardPriceHistory(cardId, options?.days ?? 90)
  const { chartData, chartDates } = historyToChartSeries(history, options?.fallbackZar ?? 0)
  return { lookup, history, chartData, chartDates }
}
