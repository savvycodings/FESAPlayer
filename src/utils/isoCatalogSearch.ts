import { getPokemonTcgImageUrlFromSetNumberIfOnCdn } from './pokemonTcgImages'

export type CatalogCardHit = {
  id: string
  name: string
  set?: string
  number?: string
  imageUrl?: string | null
}

export function mapCatalogSearchHit(raw: {
  id: string | number
  name?: string
  set?: string
  number?: string
  num?: string
  imageUrl?: string
}): CatalogCardHit {
  const set = raw.set?.trim() || ''
  const number = String(raw.number ?? raw.num ?? '').trim() || undefined
  const imageUrl =
    raw.imageUrl ||
    getPokemonTcgImageUrlFromSetNumberIfOnCdn(set, number) ||
    null
  return {
    id: String(raw.id),
    name: raw.name || 'Unknown card',
    set: set || undefined,
    number,
    imageUrl,
  }
}

export async function searchCatalogCards(
  apiBaseUrl: string,
  query: string,
  limit = 24,
): Promise<{ hits: CatalogCardHit[]; error?: string }> {
  const q = query.trim()
  if (q.length < 2) {
    return { hits: [] }
  }

  const base = apiBaseUrl.replace(/\/$/, '')
  let hits: CatalogCardHit[] = []

  try {
    const marketRes = await fetch(
      `${base}/api/market/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    )
    if (marketRes.ok) {
      const marketData = await marketRes.json()
      const marketRows = marketData.results || []
      if (marketRows.length > 0) {
        hits = marketRows.map(mapCatalogSearchHit)
      }
    }

    if (hits.length === 0) {
      const pokeRes = await fetch(
        `${base}/pokedata/search?query=${encodeURIComponent(q)}&asset_type=CARD&limit=${Math.min(limit, 20)}`,
      )
      if (pokeRes.ok) {
        const pokeData = await pokeRes.json()
        hits = (pokeData.results || []).map(mapCatalogSearchHit)
      }
    }

    if (hits.length === 0) {
      return { hits: [], error: 'No cards found. Try another name, set, or number.' }
    }

    return { hits }
  } catch (e: unknown) {
    return {
      hits: [],
      error: e instanceof Error ? e.message : 'Search failed',
    }
  }
}
