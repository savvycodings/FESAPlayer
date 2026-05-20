import { View, StyleSheet } from 'react-native'
import { useContext, useMemo } from 'react'
import { Text } from '../ui/text'
import { PortfolioCardTile } from '../profile/PortfolioCardTile'
import { ListingTileGrid } from '../ui/ListingTileGrid'
import { AppButton } from '../ui/AppButton'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import {
  computeMarketPriceChangeZar,
  formatListingPriceZar,
} from '../../utils/listingPriceMeta'

type VaultingStatus = 'vaulted' | 'seller-has' | 'unverified' | 'vaulting-in-process'
type PurchaseType = 'instant' | 'bid' | 'both'

const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

export interface StoreListing {
  id: string
  listingId?: string | number
  cardImage?: any
  cardName: string
  cardId?: string
  price: number
  quantity?: number
  setName?: string
  cardNumber?: string
  condition?: string
  metaLine?: string
  finishLabel?: string
  marketPrice?: number
  ebayLastSold?: number
  vaultingStatus: VaultingStatus
  purchaseType: PurchaseType
  currentBid?: number
  bidCount?: number
}

interface StoreListingsProps {
  listings: StoreListing[]
  onListingPress?: (listing: StoreListing) => void
  onBuyPress?: (listing: StoreListing) => void
  onBidPress?: (listing: StoreListing) => void
  isOwnListing?: boolean
  onEditPress?: (listing: StoreListing) => void
  /** Default 2 — same as shop Recent Listings */
  columns?: number
  showBuyerActions?: boolean
}

export function StoreListings({
  listings,
  onListingPress,
  onBuyPress,
  onBidPress,
  isOwnListing = false,
  onEditPress,
  columns = 2,
  showBuyerActions = true,
}: StoreListingsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles()

  const enriched = useMemo(
    () =>
      listings.map((listing) => {
        const listingZar = Math.round(Number(listing.price) || 0)
        const { priceChangeZar, priceChangePercent } = computeMarketPriceChangeZar(
          listing.marketPrice,
          listing.ebayLastSold,
          USD_TO_ZAR
        )
        return {
          listing,
          priceStr: formatListingPriceZar(listingZar),
          priceChangeZar,
          priceChangePercent,
          qty:
            listing.quantity != null
              ? Math.max(1, Math.floor(Number(listing.quantity)))
              : 1,
        }
      }),
    [listings]
  )

  if (listings.length === 0) {
    return (
      <Text style={{ fontSize: TYPOGRAPHY.caption, color: theme.mutedForegroundColor }}>
        No listings yet.
      </Text>
    )
  }

  return (
    <ListingTileGrid
      data={enriched}
      columns={columns}
      keyExtractor={(item) => String(item.listing.id)}
      renderItem={({ listing, priceStr, priceChangeZar, priceChangePercent, qty }) => {
        let footer: React.ReactNode = null
        if (isOwnListing) {
          footer = (
            <AppButton
              variant="outline"
              size="sm"
              tile
              onDarkSurface
              label="Edit"
              fullWidth
              onPress={() => onEditPress?.(listing)}
            />
          )
        } else if (showBuyerActions) {
          const showBuy =
            listing.purchaseType === 'instant' || listing.purchaseType === 'both'
          footer = (
            <View style={styles.actionRow}>
              {showBuy ? (
                <AppButton
                  variant="accent"
                  size="sm"
                  tile
                  label="Buy"
                  fullWidth
                  onPress={() => onBuyPress?.(listing)}
                  style={styles.actionBtn}
                />
              ) : null}
              <AppButton
                variant="accent"
                size="sm"
                tile
                label="Bid"
                fullWidth
                onPress={() => onBidPress?.(listing)}
                style={styles.actionBtn}
              />
            </View>
          )
        }

        return (
          <PortfolioCardTile
            relaxedBottom
            title={listing.cardName}
            setName={listing.setName}
            cardNumber={listing.cardNumber}
            metaLine={listing.metaLine}
            condition={listing.condition}
            finishLabel={listing.finishLabel}
            quantity={qty}
            quantityCaption="For sale"
            price={priceStr}
            priceChangeZar={priceChangeZar}
            priceChangePercent={priceChangePercent}
            image={listing.cardImage ?? null}
            onPress={() => onListingPress?.(listing)}
            footer={footer}
          />
        )
      }}
    />
  )
}

const getStyles = () =>
  StyleSheet.create({
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      width: '100%',
    },
    actionBtn: {
      flex: 1,
      minWidth: 0,
    },
  })
