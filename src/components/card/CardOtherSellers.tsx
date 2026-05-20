import { useContext, useEffect, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import { SPACING, TYPOGRAPHY, RADIUS, PROFILE_CHART_ACCENT } from '../../constants/layout'
import { DOMAIN } from '../../../constants'

export type OtherSellerListing = {
  id: number
  listingId?: number
  cardName: string
  cardImage?: string | null
  price: number
  cardId?: string
  setName?: string
  cardNumber?: string
  condition?: string
  storeName?: string
  sellerName?: string
  sellerId?: string
  purchaseType?: string
  currentBid?: number | null
}

type ProductStackParams = {
  Product: {
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    cardId?: string
    setName?: string
    cardNumber?: string
    set?: string
    listingId?: string
    sellerId?: string
    storeName?: string
    purchaseType?: string
    currentBid?: number
    description?: string
  }
}

type Props = {
  cardId: string
  cardName: string
  image: any
  setName?: string
  cardNumber?: string
  /** Hide the listing the user is already viewing */
  excludeListingId?: string | number
}

export function CardOtherSellers({
  cardId,
  cardName,
  image,
  setName,
  cardNumber,
  excludeListingId,
}: Props) {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<NativeStackNavigationProp<ProductStackParams>>()
  const styles = getStyles(theme)

  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<OtherSellerListing[]>([])

  useEffect(() => {
    const id = cardId?.trim()
    if (!id) {
      setListings([])
      setLoading(false)
      return
    }

    let cancelled = false
    const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
    const qs =
      excludeListingId != null && String(excludeListingId).trim() !== ''
        ? `?excludeListingId=${encodeURIComponent(String(excludeListingId))}`
        : ''

    setLoading(true)
    fetch(`${baseUrl}/api/listings/by-card/${encodeURIComponent(id)}${qs}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setListings((data.listings || []) as OtherSellerListing[])
      })
      .catch(() => {
        if (!cancelled) setListings([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cardId, excludeListingId])

  const openListing = (listing: OtherSellerListing) => {
    const listingId = listing.listingId ?? listing.id
    const imageSource = listing.cardImage ? { uri: listing.cardImage } : image
    navigation.push('Product', {
      name: listing.cardName || cardName,
      image: imageSource,
      category: 'listing',
      price: listing.price,
      description: listing.cardName || cardName,
      listingId: listingId != null ? String(listingId) : undefined,
      sellerId: listing.sellerId,
      storeName: listing.storeName || listing.sellerName,
      cardId: cardId.trim(),
      setName: setName ?? listing.setName,
      cardNumber: cardNumber ?? listing.cardNumber,
      purchaseType: listing.purchaseType as 'instant' | 'auction' | 'bid' | 'both' | undefined,
      currentBid: listing.currentBid != null ? Number(listing.currentBid) : undefined,
    })
  }

  if (!cardId?.trim()) return null

  return (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <Text style={styles.sectionTitle}>Also on the store</Text>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={PROFILE_CHART_ACCENT} />
            <Text style={styles.muted}>Loading sellers…</Text>
          </View>
        ) : listings.length === 0 ? (
          <Text style={styles.muted}>No other sellers for this card right now.</Text>
        ) : (
          <View style={styles.list}>
            {listings.map((listing, index) => {
              const sellerLabel = listing.storeName || listing.sellerName || 'Store'
              const priceZar = Math.round(Number(listing.price) || 0)
              const subtitleParts: string[] = []
              if (listing.condition) subtitleParts.push(listing.condition)
              if (listing.purchaseType === 'auction' || listing.purchaseType === 'bid') {
                subtitleParts.push('Auction')
              } else if (listing.purchaseType === 'both') {
                subtitleParts.push('Buy or bid')
              }

              return (
                <TouchableOpacity
                  key={String(listing.listingId ?? listing.id)}
                  style={[styles.row, index < listings.length - 1 && styles.rowBorder]}
                  activeOpacity={0.7}
                  onPress={() => openListing(listing)}
                >
                  <View style={styles.rowMain}>
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {sellerLabel}
                    </Text>
                    {subtitleParts.length > 0 ? (
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {subtitleParts.join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.rowPrice}>
                    R{priceZar.toLocaleString('en-ZA')}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255,255,255,0.45)"
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </CardContent>
    </Card>
  )
}

const getStyles = (theme: { textColor?: string; cardBackground?: string }) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.cardBackground || '#000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      marginBottom: SPACING.md,
    },
    cardContent: { padding: SPACING.cardPadding },
    sectionTitle: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: '600',
      color: theme.textColor || '#fff',
      marginBottom: SPACING.sm,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    muted: {
      fontSize: TYPOGRAPHY.caption,
      color: 'rgba(255,255,255,0.5)',
    },
    list: { gap: 0 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      gap: SPACING.sm,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    rowMain: { flex: 1, minWidth: 0 },
    sellerName: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: '600',
      color: theme.textColor || '#fff',
    },
    rowMeta: {
      fontSize: TYPOGRAPHY.caption,
      color: 'rgba(255,255,255,0.5)',
      marginTop: 2,
    },
    rowPrice: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: '600',
      color: PROFILE_CHART_ACCENT,
    },
    chevron: { marginLeft: SPACING.xs },
  })
