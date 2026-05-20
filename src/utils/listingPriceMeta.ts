/** Listing tile price + market/eBay change (same rules as profile ProductGrid). */

export function computeMarketPriceChangeZar(
  marketPriceUsd: number | null | undefined,
  ebayLastSoldUsd: number | null | undefined,
  usdToZar: number
): { priceChangeZar: number | null; priceChangePercent: number | null } {
  const marketNum =
    marketPriceUsd != null && Number.isFinite(Number(marketPriceUsd))
      ? Number(marketPriceUsd)
      : null
  const ebayNum =
    ebayLastSoldUsd != null && Number.isFinite(Number(ebayLastSoldUsd))
      ? Number(ebayLastSoldUsd)
      : null
  const primaryUsd =
    marketNum != null && marketNum > 0
      ? marketNum
      : ebayNum != null && ebayNum > 0
        ? ebayNum
        : null
  const valueZar =
    primaryUsd != null ? Math.round(primaryUsd * usdToZar) : 0
  const ebayZar = ebayNum != null ? Math.round(ebayNum * usdToZar) : null

  if (
    valueZar > 0 &&
    ebayZar != null &&
    ebayZar > 0 &&
    valueZar !== ebayZar
  ) {
    const priceChangeZar = valueZar - ebayZar
    const priceChangePercent = (priceChangeZar / ebayZar) * 100
    return { priceChangeZar, priceChangePercent }
  }
  return { priceChangeZar: null, priceChangePercent: null }
}

export function formatListingPriceZar(zar: number): string {
  return zar > 0 ? `R${zar.toLocaleString('en-ZA')} ZAR` : 'R0'
}
