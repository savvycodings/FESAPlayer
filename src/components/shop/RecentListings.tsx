import { View, StyleSheet } from 'react-native'
import { useContext, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../ui/text'
import { PortfolioCardTile } from '../profile/PortfolioCardTile'
import { ListingTileGrid } from '../ui/ListingTileGrid'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import {
  computeMarketPriceChangeZar,
  formatListingPriceZar,
} from '../../utils/listingPriceMeta'

export interface RecentListingItem {
  id: number
  listingId?: number
  cardName: string
  cardImage?: string | null
  price: number
  quantity?: number
  cardId?: string
  marketPrice?: number
  ebayLastSold?: number
  setName?: string
  cardNumber?: string
  condition?: string
  metaLine?: string
  finishLabel?: string
  storeName?: string
  sellerName?: string
  storeId?: number
  sellerId?: string
  vaultingStatus?: string
}

interface RecentListingsProps {
  listings: RecentListingItem[]
}

type ShopStackParamList = {
  ShopMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
    listingId?: number
    storeId?: number
    sellerId?: string
    storeName?: string
  }
}

type RecentListingsNavigationProp = NativeStackNavigationProp<ShopStackParamList, 'ShopMain'>

const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

export function RecentListings({ listings }: RecentListingsProps) {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<RecentListingsNavigationProp>()
  const styles = getStyles()

  const enriched = useMemo(
    () =>
      listings.map((item) => {
        const listingZar = Math.round(Number(item.price) || 0)
        const { priceChangeZar, priceChangePercent } = computeMarketPriceChangeZar(
          item.marketPrice,
          item.ebayLastSold,
          USD_TO_ZAR
        )
        return {
          ...item,
          priceStr: formatListingPriceZar(listingZar),
          priceChangeZar,
          priceChangePercent,
          qty: item.quantity != null ? Math.max(1, Math.floor(item.quantity)) : 1,
        }
      }),
    [listings]
  )

  return (
    <ListingTileGrid
      data={enriched}
      columns={2}
      keyExtractor={(item) => String(item.id)}
      emptyComponent={
        <View style={styles.empty}>
          <Text
            style={{
              fontSize: TYPOGRAPHY.caption,
              color: theme.mutedForegroundColor,
              textAlign: 'center',
            }}
          >
            No listings yet. Listings from stores will appear here.
          </Text>
        </View>
      }
      renderItem={(item) => {
        const imageSource = item.cardImage ? { uri: item.cardImage } : null

        return (
          <PortfolioCardTile
            title={item.cardName}
            setName={item.setName}
            cardNumber={item.cardNumber}
            metaLine={item.metaLine}
            condition={item.condition}
            finishLabel={item.finishLabel}
            quantity={item.qty}
            quantityCaption="For sale"
            price={item.priceStr}
            priceChangeZar={item.priceChangeZar}
            priceChangePercent={item.priceChangePercent}
            image={imageSource}
            onPress={() => {
              navigation.navigate('Product', {
                name: item.cardName,
                image: imageSource,
                category: 'listing',
                price: item.price,
                description: item.cardName,
                listingId: item.listingId ?? item.id,
                storeId: item.storeId,
                sellerId: item.sellerId,
                storeName: item.storeName || item.sellerName || undefined,
              })
            }}
          />
        )
      }}
    />
  )
}

const getStyles = () =>
  StyleSheet.create({
    empty: {
      paddingVertical: SPACING.lg,
      width: '100%',
    },
  })
