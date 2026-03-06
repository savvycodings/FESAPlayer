import { View, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export interface RecentListingItem {
  id: number
  listingId?: number
  cardName: string
  cardImage?: string | null
  price: number
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

export function RecentListings({ listings }: RecentListingsProps) {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<RecentListingsNavigationProp>()
  const styles = getStyles(theme)

  if (listings.length === 0) {
    return (
      <View style={[styles.recentListingsGrid, { paddingVertical: SPACING.lg }]}>
        <Text style={{ fontSize: TYPOGRAPHY.body, color: theme.mutedForegroundColor, textAlign: 'center' }}>
          No listings yet. Listings from stores will appear here.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.recentListingsGrid}>
      {listings.map((item, index) => {
        const isLeftBox = index % 2 === 0
        const isRightBox = index % 2 === 1
        const imageSource = item.cardImage ? { uri: item.cardImage } : null
        const sellerLabel = item.sellerName || item.storeName || 'Seller'

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.listingCard,
              isLeftBox && styles.listingCardLeft,
              isRightBox && styles.listingCardRight,
            ]}
            onPress={() => {
              navigation.navigate('Product', {
                name: item.cardName,
                image: imageSource,
                category: 'listing',
                price: item.price,
                description: item.cardName ? `Premium ${item.cardName}. Authentic and verified with secure shipping.` : undefined,
                listingId: item.listingId ?? item.id,
                storeId: item.storeId,
                sellerId: item.sellerId,
                storeName: item.storeName || item.sellerName || undefined,
              })
            }}
            activeOpacity={0.8}
          >
            {imageSource ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={imageSource}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.listingTextOverlay}>
                  <View style={styles.listingTextContent}>
                    <Text style={styles.listingText} numberOfLines={1} ellipsizeMode="tail">
                      {item.cardName}
                    </Text>
                    <Text style={styles.listingSubText} numberOfLines={1} ellipsizeMode="tail">
                      {sellerLabel}
                    </Text>
                  </View>
                  <Text style={styles.listingPrice}>R{item.price.toFixed(2)}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.3)'}
                />
                <View style={styles.listingTextOverlay}>
                  <View style={styles.listingTextContent}>
                    <Text style={styles.listingText} numberOfLines={1} ellipsizeMode="tail">
                      {item.cardName}
                    </Text>
                    <Text style={styles.listingSubText} numberOfLines={1} ellipsizeMode="tail">
                      {sellerLabel}
                    </Text>
                  </View>
                  <Text style={styles.listingPrice}>R{item.price.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  recentListingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 0,
    marginRight: 0,
    justifyContent: 'space-between',
  },
  listingCard: {
    width: '48%',
    aspectRatio: 0.75,
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
    elevation: 3,
    position: 'relative',
  },
  listingCardLeft: {
    marginRight: '2%',
  },
  listingCardRight: {
    marginLeft: '2%',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.lg,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.cardBackground || '#000000',
    position: 'relative',
  },
  listingTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  listingTextContent: {
    marginBottom: 6,
  },
  listingText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.1,
    ...(Platform.OS === 'web'
      ? { textShadow: '0 1px 3px rgba(0,0,0,0.5)' }
      : {
          textShadowColor: 'rgba(0, 0, 0, 0.5)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }),
  },
  listingSubText: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: theme.textColor || 'rgba(255, 255, 255, 0.85)',
    ...(Platform.OS === 'web'
      ? { textShadow: '0 1px 3px rgba(0,0,0,0.5)' }
      : {
          textShadowColor: 'rgba(0, 0, 0, 0.5)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }),
  },
  listingPrice: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    ...(Platform.OS === 'web'
      ? { textShadow: '0 1px 3px rgba(0,0,0,0.5)' }
      : {
          textShadowColor: 'rgba(0, 0, 0, 0.5)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }),
  },
})
