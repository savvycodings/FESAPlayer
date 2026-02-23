import { useContext, useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../components/ui/text'
import { Card, CardContent } from '../components/ui/card'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { PriceChart } from '../components/profile/PriceChart'
import { PayFastPayment } from '../components/payment'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'
type ProductRouteParams = {
  Product: {
    id?: string
    /** Pokedata card ID for fetching price history (chart) */
    cardId?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    ebayPrice?: number
    description?: string
    set?: string
    fromProfile?: boolean
    /** When true, show Remove listing and use listingId for DELETE store listing */
    fromMyStore?: boolean
    listingId?: string
    storeName?: string
  }
  ViewProfile: {
    userId?: string
    userName: string
    userImage?: any
    userInitials?: string
    verified?: boolean
  }
}

type ProductScreenRouteProp = RouteProp<ProductRouteParams, 'Product'>
type ProductScreenNavigationProp = NativeStackNavigationProp<ProductRouteParams, 'Product'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Product() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ProductScreenNavigationProp>()
  const route = useRoute<ProductScreenRouteProp>()
  const { id, name, image, category, price, ebayPrice, description, fromProfile, fromMyStore, listingId, storeName, cardId } = route.params || {}
  const tintColor = theme.tintColor || '#73EC8B'
  const styles = getStyles(theme, tintColor)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [paymentType, setPaymentType] = useState<'buy' | 'bid'>('buy')
  const [removing, setRemoving] = useState(false)
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([])
  const [chartDates, setChartDates] = useState<string[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  // Format product name
  const formattedName = name
    ?.replace(/Pokémon[-_]TCG[-_]/g, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Product'

  // Default price if not provided
  const displayPrice = price || 29.99

  // Default description
  const displayDescription = description || 
    'Premium trading card product with authentic cards and exclusive items. Perfect for collectors and players alike.'

  // Bids data
  const bidsData = [
    { avatar: require('../../assets/Avatars/guy1.jpg'), name: 'Alex', bid: 145 },
    { avatar: require('../../assets/Avatars/guy2.jpg'), name: 'Michael', bid: 142 },
    { avatar: require('../../assets/Avatars/guy3.jpg'), name: 'David', bid: 140 },
    { avatar: require('../../assets/Avatars/guy4.jpg'), name: 'Emily', bid: 138 },
    { avatar: require('../../assets/Avatars/guy5.jpg'), name: 'Sarah', bid: 135 },
  ]

  // Get highest bid
  const highestBid = Math.max(...bidsData.map(b => b.bid))
  
  // Buy now price is R20 more than highest bid
  const buyNowPrice = highestBid + 20

  const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 16

  // Remove from collection (only when opened from Profile with a collection id)
  const performRemove = async () => {
    const collectionId = id != null ? String(id).trim() : ''
    if (!collectionId) {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Cannot remove: missing card id.')
      return
    }
    try {
      setRemoving(true)
      const session = await authClient.getSession()
      const token = session?.data?.session?.token
      if (!token) {
        setRemoving(false)
        if (Platform.OS !== 'web') Alert.alert('Error', 'Please log in')
        return
      }
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/collections/${collectionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setRemoving(false)
        if (Platform.OS !== 'web') Alert.alert('Error', data.message || 'Failed to remove card from collection')
        return
      }
      navigation.goBack()
    } catch (error: any) {
      console.error('Error removing collection item:', error)
      setRemoving(false)
      if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to remove card from collection')
    } finally {
      setRemoving(false)
    }
  }

  const handleRemoveFromCollection = () => {
    if (!fromProfile) return
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure?')) performRemove()
      return
    }
    Alert.alert(
      'Are you sure?',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I'm sure",
          style: 'destructive',
          onPress: performRemove,
        },
      ],
    )
  }

  // Remove store listing (when opened from My Store → My Listings)
  const performRemoveListing = async () => {
    const lid = listingId != null ? String(listingId).trim() : ''
    if (!lid) {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Cannot remove: missing listing id.')
      return
    }
    try {
      setRemoving(true)
      const session = await authClient.getSession()
      const token = session?.data?.session?.token
      if (!token) {
        setRemoving(false)
        if (Platform.OS !== 'web') Alert.alert('Error', 'Please log in')
        return
      }
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/listings/${lid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setRemoving(false)
        if (Platform.OS !== 'web') Alert.alert('Error', data.message || 'Failed to remove listing')
        return
      }
      navigation.goBack()
    } catch (error: any) {
      console.error('Error removing listing:', error)
      setRemoving(false)
      if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to remove listing')
    } finally {
      setRemoving(false)
    }
  }

  const handleRemoveListing = () => {
    if (!fromMyStore) return
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure?')) performRemoveListing()
      return
    }
    Alert.alert(
      'Are you sure?',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I'm sure",
          style: 'destructive',
          onPress: performRemoveListing,
        },
      ],
    )
  }

  // Fetch price history for chart when cardId is present (e.g. from collection)
  useEffect(() => {
    if (!cardId?.trim()) {
      setChartData(displayPrice > 0 ? [{ x: 0, y: displayPrice }, { x: 1, y: displayPrice }] : [])
      setChartDates([])
      return
    }
    let cancelled = false
    setChartLoading(true)
    const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
    fetch(`${baseUrl}/pokedata/card/${encodeURIComponent(cardId.trim())}/price-history?days=30`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const history = data.history || []
        if (history.length === 0) {
          setChartData(displayPrice > 0 ? [{ x: 0, y: displayPrice }, { x: 1, y: displayPrice }] : [])
          setChartDates([])
        } else {
          const points = history.map((h: { date?: string; marketPrice?: number | null }, i: number) => {
            const y = (h.marketPrice != null ? h.marketPrice * USD_TO_ZAR : displayPrice)
            return { x: i, y }
          })
          setChartData(points)
          setChartDates(history.map((h: { date?: string }) => h.date || ''))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChartData(displayPrice > 0 ? [{ x: 0, y: displayPrice }, { x: 1, y: displayPrice }] : [])
          setChartDates([])
        }
      })
      .finally(() => { if (!cancelled) setChartLoading(false) })
    return () => { cancelled = true }
  }, [cardId, displayPrice, USD_TO_ZAR])

  const currentValueData = chartData.length > 0 ? chartData : (displayPrice > 0 ? [{ x: 0, y: displayPrice }, { x: 1, y: displayPrice }] : [])

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          onPress={() => setIsFavorited(!isFavorited)}
          style={styles.headerFavoriteButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={24}
            color={isFavorited ? "#FF0000" : theme.textColor}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image Card */}
        <Card style={styles.imageCard}>
          <CardContent style={styles.imageCardContent}>
            <View style={styles.imageContainer}>
              <Image
                source={image}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          </CardContent>
        </Card>

        {/* Thumbnail Images - only on non-profile product page */}
        {!fromProfile && (
          <View style={styles.thumbnailContainer}>
            {[1, 2, 3, 4, 5].map((index) => (
              <TouchableOpacity
                key={index}
                style={styles.thumbnailWrapper}
                activeOpacity={0.7}
              >
                <Card style={styles.thumbnailCard}>
                  <CardContent style={styles.thumbnailCardContent}>
                    <View style={styles.thumbnailImageContainer}>
                      <Image
                        source={image}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Product Details Card */}
        <Card style={styles.detailsCard}>
          <CardContent style={styles.detailsContent}>
            {/* Product Name */}
            <Text style={styles.productTitle} numberOfLines={2}>
              {formattedName}
            </Text>

            {/* Seller Info with Rating - only on non-profile product page */}
            {!fromProfile && (
              <View style={styles.sellerSection}>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerIconContainer}>
                    <Ionicons name="storefront-outline" size={16} color={theme.textColor} />
                  </View>
                  <Text style={styles.sellerName}>{storeName || "Kyle's Card Shop"}</Text>
                </View>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={14}
                        color={tintColor}
                        style={styles.star}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.9</Text>
                </View>
              </View>
            )}

            {/* Price Section: market value + eBay last sold from API/cache */}
            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <View style={styles.priceIconContainer}>
                  <Ionicons name="cash-outline" size={20} color={tintColor} />
                </View>
                <View style={styles.priceTextContainer}>
                  <Text style={styles.priceLabel}>Market value</Text>
                  <Text style={styles.priceText}>
                    R{displayPrice.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
              {ebayPrice != null && ebayPrice > 0 && (
                <View style={styles.priceContainer}>
                  <View style={styles.priceIconContainer}>
                    <Ionicons name="pricetag-outline" size={20} color={tintColor} />
                  </View>
                  <View style={styles.priceTextContainer}>
                    <Text style={styles.priceLabel}>eBay last sold</Text>
                    <Text style={styles.priceText}>
                      R{ebayPrice.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Market value chart - real history when cardId present, else flat line */}
        {chartLoading && cardId ? (
          <Card style={styles.imageCard}>
            <CardContent style={styles.imageCardContent}>
              <View style={{ paddingVertical: SPACING.xl, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={tintColor} />
                <Text style={[styles.priceLabel, { marginTop: SPACING.sm }]}>Loading price history…</Text>
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

        {/* Bids Section - only on non-profile product page */}
        {!fromProfile && (
          <Card style={styles.bidsCard}>
            <CardContent style={styles.bidsContent}>
              <Text style={styles.bidsTitle}>Bids</Text>
              <View style={styles.bidsList}>
                {bidsData.map((bidder, index) => (
                  <View key={index} style={styles.bidItem}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('ViewProfile', {
                          userId: `user-${bidder.name.toLowerCase().replace(/\s+/g, '-')}`,
                          userName: bidder.name,
                          userImage: bidder.avatar,
                          userInitials: bidder.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                          verified: false,
                        })
                      }}
                      activeOpacity={0.7}
                    >
                      <Image source={bidder.avatar} style={styles.bidAvatar} />
                    </TouchableOpacity>
                    <View style={styles.bidInfo}>
                      <Text style={styles.bidderName}>{bidder.name}</Text>
                      <Text style={styles.bidAmount}>R{bidder.bid}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* About / Remove Section */}
        {fromProfile && id ? (
          <Card style={styles.aboutCard}>
            <CardContent style={styles.aboutContent}>
              <TouchableOpacity
                style={[styles.removeFromCollectionButton, removing && { opacity: 0.7 }]}
                onPress={handleRemoveFromCollection}
                activeOpacity={0.8}
                disabled={removing}
              >
                {removing ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.removeFromCollectionButtonText}>Remove from collection</Text>
                )}
              </TouchableOpacity>
            </CardContent>
          </Card>
        ) : fromMyStore && listingId ? (
          <Card style={styles.aboutCard}>
            <CardContent style={styles.aboutContent}>
              <TouchableOpacity
                style={[styles.removeFromCollectionButton, removing && { opacity: 0.7 }]}
                onPress={handleRemoveListing}
                activeOpacity={0.8}
                disabled={removing}
              >
                {removing ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.removeFromCollectionButtonText}>Remove listing</Text>
                )}
              </TouchableOpacity>
            </CardContent>
          </Card>
        ) : (
          <Card style={styles.aboutCard}>
            <CardContent style={styles.aboutContent}>
              <View style={styles.aboutHeader}>
                <View style={styles.aboutIconContainer}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.textColor} />
                </View>
                <Text style={styles.aboutHeading}>About the Product</Text>
              </View>
              <Text style={styles.descriptionText}>
                {displayDescription}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Additional spacing at bottom for bottom bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar - only on non-profile product page */}
      {!fromProfile && (
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={styles.bidNowButton}
            onPress={() => {
              setPaymentType('bid')
              setIsPaymentModalVisible(true)
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="hand-left-outline" size={20} color={theme.textColor} style={styles.bidIcon} />
            <Text style={styles.bidNowButtonText}>Bid Now</Text>
            <Text style={styles.bidNowButtonPrice}>R{highestBid + 1}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={() => {
              setPaymentType('buy')
              setIsPaymentModalVisible(true)
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="flash-outline" size={20} color={theme.tintTextColor || '#000000'} style={styles.buyIcon} />
            <Text style={styles.buyNowButtonText}>Buy Now</Text>
            <Text style={styles.buyNowButtonPrice}>R{buyNowPrice}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PayFast Payment Modal */}
      <PayFastPayment
        visible={isPaymentModalVisible}
        amount={paymentType === 'buy' ? buyNowPrice : highestBid + 1}
        itemName={formattedName}
        itemDescription={displayDescription}
        onClose={() => setIsPaymentModalVisible(false)}
        onSuccess={(paymentData) => {
          console.log('Payment successful:', paymentData)
          // Payment success is already shown in PayFastPayment component
          // Here we can handle additional actions:
          // - Update order status in database
          // - Notify seller
          // - Add to orders
          // - Refresh product data
          setIsPaymentModalVisible(false)
          // TODO: Navigate to order confirmation or refresh product
        }}
        onCancel={() => {
          console.log('Payment cancelled')
          setIsPaymentModalVisible(false)
        }}
        onError={(error) => {
          console.error('Payment error:', error)
          // TODO: Show error message to user
        }}
      />
    </View>
  )
}

const getStyles = (theme: any, tintColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: theme.backgroundColor,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  headerFavoriteButton: {
    padding: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 100, // Space for bottom action bar
  },
  imageCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  imageCardContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 2.5 / 3.5, // standard trading card (portrait) so full image isn't cut off
    backgroundColor: theme.cardBackground || 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  thumbnailWrapper: {
    flex: 1,
  },
  thumbnailCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  thumbnailCardContent: {
    padding: 0,
  },
  thumbnailImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  detailsCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  detailsContent: {
    padding: SPACING.cardPadding,
  },
  productTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  sellerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  sellerName: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: SPACING.xs,
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  priceSection: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: hexToRgba(tintColor, 0.1),
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: hexToRgba(tintColor, 0.2),
  },
  priceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: hexToRgba(tintColor, 0.2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  priceTextContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.xs / 2,
  },
  priceText: {
    fontSize: TYPOGRAPHY.h1,
    fontFamily: theme.boldFont,
    color: tintColor,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  aboutCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  aboutContent: {
    padding: SPACING.cardPadding,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aboutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  aboutHeading: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  removeFromCollectionButton: {
    marginTop: SPACING.lg,
    backgroundColor: theme.destructiveColor || '#ef4444',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFromCollectionButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: '#000000',
    fontWeight: '600',
  },
  bidsCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  bidsContent: {
    padding: SPACING.cardPadding,
  },
  bidsTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  bidsList: {
    gap: SPACING.sm,
  },
  bidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  bidAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bidInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidderName: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
  },
  bidAmount: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: tintColor,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: SPACING.lg,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING['3xl'],
    backgroundColor: theme.backgroundColor,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: SPACING.sm,
  },
  bidNowButton: {
    flex: 1,
    backgroundColor: theme.buttonBackground || 'rgba(0, 0, 0, 0.8)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
    gap: SPACING.xs,
  },
  bidIcon: {
    marginRight: 0,
  },
  bidNowButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  bidNowButtonPrice: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: tintColor,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  buyIcon: {
    marginRight: 0,
  },
  buyNowButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.tintTextColor || '#000000',
    fontWeight: '600',
  },
  buyNowButtonPrice: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.tintTextColor ? `${theme.tintTextColor}CC` : 'rgba(0, 0, 0, 0.8)',
    fontWeight: '600',
  },
})
