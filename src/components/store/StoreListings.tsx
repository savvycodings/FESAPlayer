import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { ListingTile } from '../ui/ListingTile'
import { AppButton } from '../ui/AppButton'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import { listingTileWidth } from '../../utils/listingGrid'

type VaultingStatus = 'vaulted' | 'seller-has' | 'unverified' | 'vaulting-in-process'
type PurchaseType = 'instant' | 'bid' | 'both'

export interface StoreListing {
  id: string
  cardImage?: any
  cardName: string
  cardId?: string
  price: number
  quantity?: number
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
  columns?: number
  /** Show Buy/Bid on tiles (view other store). Uses compact label-only row. */
  showBuyerActions?: boolean
}

export function StoreListings({
  listings,
  onListingPress,
  onBuyPress,
  onBidPress,
  isOwnListing = false,
  onEditPress,
  columns: columnsProp,
  showBuyerActions = true,
}: StoreListingsProps) {
  const { theme } = useContext(ThemeContext)
  const { width } = useWindowDimensions()
  const tileWidth = listingTileWidth(width, columnsProp)
  const styles = getStyles()

  if (listings.length === 0) {
    return (
      <Text style={{ fontSize: TYPOGRAPHY.caption, color: theme.mutedForegroundColor }}>
        No listings yet.
      </Text>
    )
  }

  return (
    <View style={styles.container}>
      {listings.map((listing) => {
        const priceLabel = listing.currentBid
          ? `Bid R${Number(listing.currentBid).toLocaleString('en-ZA')}`
          : `R${Number(listing.price).toLocaleString('en-ZA')}`

        let footer: React.ReactNode = null
        if (isOwnListing) {
          footer = (
            <AppButton
              variant="filled"
              size="sm"
              tile
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
                  variant="filled"
                  size="sm"
                  tile
                  label="Buy"
                  fullWidth
                  onPress={() => onBuyPress?.(listing)}
                  style={styles.actionBtn}
                />
              ) : null}
              <AppButton
                variant="outline"
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
          <View key={listing.id} style={[styles.tileWrap, { width: tileWidth, maxWidth: tileWidth }]}>
            <ListingTile
              title={listing.cardName}
              price={priceLabel}
              image={listing.cardImage}
              imageResizeMode="cover"
              onPress={() => onListingPress?.(listing)}
              footer={footer}
            />
          </View>
        )
      })}
    </View>
  )
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: SPACING.gridColumnGap,
      rowGap: SPACING.gridRowGap,
      width: '100%',
    },
    tileWrap: {
      minWidth: 0,
    },
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
