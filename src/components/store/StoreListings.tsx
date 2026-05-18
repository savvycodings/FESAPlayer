import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { ListingCard } from './ListingCard'
import { getTwoColumnItemWidth } from '../../utils/layoutHelpers'
import { SPACING } from '../../constants/layout'

type VaultingStatus = 'vaulted' | 'seller-has' | 'unverified' | 'vaulting-in-process'
type PurchaseType = 'instant' | 'bid' | 'both'

export interface StoreListing {
  id: string
  cardImage?: any
  cardName: string
  cardId?: string
  price: number
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
}

export function StoreListings({
  listings,
  onListingPress,
  onBuyPress,
  onBidPress,
  isOwnListing = false,
  onEditPress,
}: StoreListingsProps) {
  const styles = getStyles()
  const { width: screenWidth } = useWindowDimensions()
  const cardWidth = getTwoColumnItemWidth(screenWidth)

  return (
    <View style={styles.container}>
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          {...listing}
          cardWidth={cardWidth}
          onPress={() => onListingPress?.(listing)}
          onBuyPress={() => onBuyPress?.(listing)}
          onBidPress={() => onBidPress?.(listing)}
          isOwnListing={isOwnListing}
          onEditPress={() => onEditPress?.(listing)}
        />
      ))}
    </View>
  )
}

const GRID_GAP = 8

const getStyles = () => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    columnGap: GRID_GAP,
    rowGap: SPACING.xl,
  },
})
