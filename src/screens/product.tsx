import { useContext, useState } from 'react'
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
import { CardPriceSection } from '../components/card/CardPriceSection'
import { PayFastPayment } from '../components/payment'
import { AppButton } from '../components/ui/AppButton'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'
type ProductRouteParams = {
  Product: {
    id?: string
    /** Pokedata card ID for fetching price history (chart) and 80% min bid floor */
    cardId?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    ebayPrice?: number
    description?: string
    set?: string
    fromProfile?: boolean
    fromMyStore?: boolean
    listingId?: string
    sellerId?: string
    storeName?: string
    /** When 'auction', 'bid', or 'both', show Bid button and use 80% market floor when cardId present */
    purchaseType?: 'instant' | 'auction' | 'bid' | 'both'
    /** Current highest bid (ZAR) for listings that allow bids */
    currentBid?: number
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
  const { id, name, image, category, price, ebayPrice, description, fromProfile, fromMyStore, listingId, sellerId, storeName, cardId, purchaseType, currentBid: routeCurrentBid } = route.params || {}
  const tintColor = theme.tintColor || '#73EC8B'
  const styles = getStyles(theme, tintColor)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [paymentType, setPaymentType] = useState<'buy' | 'bid'>('buy')
  /** Set when opening payment for a listing so PayFastPayment has buyerId and user details */
  const [paymentBuyer, setPaymentBuyer] = useState<{ id: string; email: string; firstName: string; lastName: string } | null>(null)
  /** PUDO from account, passed to PayFastPayment so shipping form is pre-filled */
  const [initialPudoLockerCode, setInitialPudoLockerCode] = useState('')
  const [initialShippingAddress, setInitialShippingAddress] = useState('')
  const [removing, setRemoving] = useState(false)
  /** Market price USD from card_prices (for 80% min bid floor). Set when cardId is present. */
  const [marketPriceUsd, setMarketPriceUsd] = useState<number | null>(null)
  // Format product name
  const formattedName = name
    ?.replace(/Pokémon[-_]TCG[-_]/g, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Product'

  // Default price if not provided
  const displayPrice = typeof price === 'number' ? price : (typeof price === 'string' ? parseFloat(price) || 0 : 0) || 29.99

  // Default description
  const displayDescription = description || 
    'Premium trading card product with authentic cards and exclusive items. Perfect for collectors and players alike.'

  const isListing = category === 'listing'
  // Bids: use route currentBid for listings; empty array until you have a bids API
  const bidsData: { avatar?: any; name: string; bid: number }[] = []
  const highestBid = isListing && routeCurrentBid != null ? routeCurrentBid : (bidsData.length > 0 ? Math.max(...bidsData.map(b => b.bid)) : 0)
  const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17
  const eightyPercentMarketZar = marketPriceUsd != null && marketPriceUsd > 0 ? Math.round(0.8 * marketPriceUsd * USD_TO_ZAR) : null
  const buyNowPrice = isListing ? displayPrice : (highestBid > 0 ? highestBid + 20 : displayPrice)
  const minBidPriceRaw = isListing ? (highestBid > 0 ? highestBid + 1 : displayPrice) : (highestBid > 0 ? highestBid + 1 : displayPrice)
  const minBidPrice = eightyPercentMarketZar != null && eightyPercentMarketZar > 0 ? Math.max(minBidPriceRaw, eightyPercentMarketZar) : minBidPriceRaw
  const allowsBid = isListing && (purchaseType === 'auction' || purchaseType === 'both' || purchaseType === 'bid')

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

  // Open payment modal; for listings, ensure we have listingId, sellerId and fetch buyer from session
  const openPaymentModal = async (type: 'buy' | 'bid') => {
    setPaymentType(type)
    if (isListing) {
      if (!listingId || !sellerId) {
        Alert.alert('Error', 'Missing listing or seller information. Please go back and try again from the listing.')
        return
      }
      try {
        const session = await authClient.getSession()
        const user = (session?.data as any)?.user
        if (!user?.id) {
          Alert.alert('Error', 'Please log in to purchase.')
          return
        }
        if (!user.email) {
          Alert.alert('Error', 'Please add an email to your profile to complete payment.')
          return
        }
        const nameParts = (user.name || 'User').trim().split(' ')
        setPaymentBuyer({
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? nameParts[0] ?? 'User',
          lastName: user.lastName ?? nameParts.slice(1).join(' ') ?? '',
        })
        // Pre-fill PUDO from account so seller knows where to send
        const token = (session?.data as any)?.session?.token
        const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
        if (token && baseUrl) {
          try {
            const res = await fetch(`${baseUrl}/api/profile/user`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const data = res.ok ? await res.json() : {}
            const profile = data.user ?? data
            setInitialPudoLockerCode(profile.pudoLockerCode ?? '')
            setInitialShippingAddress(profile.pudoAddress ?? '')
          } catch {
            setInitialPudoLockerCode('')
            setInitialShippingAddress('')
          }
        } else {
          setInitialPudoLockerCode('')
          setInitialShippingAddress('')
        }
      } catch (e) {
        console.error('Error getting session for payment:', e)
        Alert.alert('Error', 'Please log in to purchase.')
        return
      }
    } else {
      setPaymentBuyer(null)
      setInitialPudoLockerCode('')
      setInitialShippingAddress('')
    }
    setIsPaymentModalVisible(true)
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
                resizeMode="cover"
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
                  <Text style={styles.sellerName}>{storeName || 'Store'}</Text>
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
                  <Text style={styles.priceLabel}>{isListing ? 'Listed price' : 'Market value'}</Text>
                  <Text style={styles.priceText}>
                    R{Number(displayPrice).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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

        {cardId?.trim() ? (
          <CardPriceSection
            cardId={cardId.trim()}
            displayPriceZar={displayPrice}
            days={90}
            onMarketPriceUsd={setMarketPriceUsd}
          />
        ) : null}

        {/* Bids Section - only on non-profile product page; shows actual bid count */}
        {!fromProfile && (
          <Card style={styles.bidsCard}>
            <CardContent style={styles.bidsContent}>
              <Text style={styles.bidsTitle}>Bids{bidsData.length > 0 ? ` (${bidsData.length})` : ''}</Text>
              {bidsData.length === 0 ? (
                <Text style={[styles.bidsEmpty, { color: theme.mutedForegroundColor || 'rgba(255,255,255,0.5)' }]}>
                  No bids yet
                </Text>
              ) : (
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
              )}
            </CardContent>
          </Card>
        )}

        {/* About / Remove Section */}
        {fromProfile && id ? (
          <Card style={styles.aboutCard}>
            <CardContent style={styles.aboutContent}>
              <AppButton
                variant="outline"
                size="md"
                onDarkSurface
                icon="trash-outline"
                label={removing ? 'Removing…' : 'Remove from collection'}
                fullWidth
                onPress={handleRemoveFromCollection}
                disabled={removing}
                style={styles.removeFromCollectionButton}
              />
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
          {allowsBid && (
            <AppButton
              variant="outline"
              size="lg"
              onDarkSurface
              icon="hammer-outline"
              label={`Bid R${minBidPrice.toLocaleString('en-ZA')}`}
              onPress={() => openPaymentModal('bid')}
              style={styles.bottomBarButton}
            />
          )}
          <AppButton
            variant="accent"
            size="lg"
            icon="flash-outline"
            label={`Buy R${buyNowPrice.toLocaleString('en-ZA')}`}
            onPress={() => openPaymentModal('buy')}
            style={styles.bottomBarButton}
          />
        </View>
      )}

      {/* PayFast Payment Modal - for listings requires listingId, sellerId, buyerId from route/session */}
      <PayFastPayment
        visible={isPaymentModalVisible}
        amount={paymentType === 'buy' ? buyNowPrice : minBidPrice}
        itemName={formattedName}
        itemDescription={displayDescription}
        itemAmount={paymentType === 'buy' ? buyNowPrice : undefined}
        shippingFee={isListing && paymentType === 'buy' ? 100 : undefined}
        userEmail={paymentBuyer?.email}
        userNameFirst={paymentBuyer?.firstName}
        userNameLast={paymentBuyer?.lastName}
        listingId={isListing && listingId != null ? String(listingId) : undefined}
        buyerId={isListing ? paymentBuyer?.id : undefined}
        sellerId={isListing && sellerId != null ? String(sellerId) : undefined}
        initialPudoLockerCode={isListing ? initialPudoLockerCode : undefined}
        initialShippingAddress={isListing ? initialShippingAddress : undefined}
        onClose={() => {
          setIsPaymentModalVisible(false)
          setPaymentBuyer(null)
          setInitialPudoLockerCode('')
          setInitialShippingAddress('')
        }}
        onSuccess={(paymentData) => {
          console.log('Payment successful:', paymentData)
          setIsPaymentModalVisible(false)
          setPaymentBuyer(null)
          setInitialPudoLockerCode('')
          setInitialShippingAddress('')
        }}
        onCancel={() => {
          setIsPaymentModalVisible(false)
          setPaymentBuyer(null)
          setInitialPudoLockerCode('')
          setInitialShippingAddress('')
        }}
        onError={(error) => {
          console.error('Payment error:', error)
          setIsPaymentModalVisible(false)
          setPaymentBuyer(null)
          setInitialPudoLockerCode('')
          setInitialShippingAddress('')
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
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
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
    aspectRatio: 2.5 / 3.5,
    backgroundColor: theme.cardBackground || 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
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
  bidsEmpty: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    marginVertical: SPACING.sm,
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
    paddingBottom: SPACING.screenBottom,
    backgroundColor: theme.cardBackground || '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    gap: SPACING.sm,
  },
  bottomBarButton: {
    flex: 1,
  },
})
