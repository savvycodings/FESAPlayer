import { useContext, useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../components/ui/text'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { Section } from '../components/layout/Section'
import { CompactAccordion } from '../components/layout/CompactAccordion'
import { IsoListItem } from '../components/store/IsoListItem'
import Ionicons from '@expo/vector-icons/Ionicons'
import { DOMAIN } from '../../constants'
import { authClient } from '../lib/auth-client'
import { getPokemonTcgImageUrlFromSetNumberIfOnCdn } from '../utils/pokemonTcgImages'
import {
  StoreHeader,
  StoreStats,
  StoreListings,
  SafetyFilter,
} from '../components/store'
import { LeaveReviewModal } from '../components/store/LeaveReviewModal'
import { AppButton } from '../components/ui/AppButton'
import { type StoreListing } from '../components/store/StoreListings'
import { AuctionSection, type Auction } from '../components/profile'
import { PayFastPayment } from '../components/payment'

const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17
const formatIsoPrice = (usd: number) =>
  `R${Math.round(usd * USD_TO_ZAR).toLocaleString('en-ZA')}`

type ViewProfileStackParamList = {
  ViewProfile: {
    userId: string
    userName: string
    userImage?: any
    userInitials?: string
    verified?: boolean
    storeId?: number
  }
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
    listingId?: string
    sellerId?: string
    storeName?: string
    cardId?: string
    purchaseType?: 'instant' | 'auction' | 'bid' | 'both'
    currentBid?: number
  }
}

type ViewProfileScreenRouteProp = RouteProp<ViewProfileStackParamList, 'ViewProfile'>
type ViewProfileScreenNavigationProp = NativeStackNavigationProp<ViewProfileStackParamList, 'ViewProfile'>

export function ViewProfile() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ViewProfileScreenNavigationProp>()
  const route = useRoute<ViewProfileScreenRouteProp>()
  const { userId, userName, userImage, userInitials, verified, storeId } = route.params || {
    userId: '',
    userName: 'User',
    userInitials: 'U',
    verified: false,
    storeId: undefined,
  }
  const styles = getStyles(theme)
  const [vaultedOnly, setVaultedOnly] = useState(false)
  const [reviewsExpanded, setReviewsExpanded] = useState(false)
  const [isoExpanded, setIsoExpanded] = useState(false)
  const [isoItems, setIsoItems] = useState<any[]>([])
  const [isoLoading, setIsoLoading] = useState(false)
  const [storeData, setStoreData] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedListing, setSelectedListing] = useState<StoreListing | null>(null)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [paymentType, setPaymentType] = useState<'buy' | 'bid'>('buy')
  const [storeReviews, setStoreReviews] = useState<Array<{
    id: number | string
    reviewerName: string
    reviewerAvatar?: any
    rating: number
    date: string
    comment?: string | null
  }>>([])
  const [isLeaveReviewVisible, setIsLeaveReviewVisible] = useState(false)

  // Sample auctions data for the viewed user
  const userAuctions: Auction[] = [
    {
      id: 'auction-1',
      title: 'Rare Charizard Collection',
      description: 'Auctioning off my premium Charizard cards.',
      status: 'live',
      timeRemaining: 'Ends in 2h 30m',
      currentBid: 450,
      bidCount: 12,
      image: require('../../assets/singles/Shining_Charizard_Secret.jpg'),
    },
    {
      id: 'auction-2',
      title: 'Hidden Fates Elite Trainer Box',
      description: 'New in box, never opened. Starting bid R120.',
      status: 'starting',
      timeRemaining: 'Starts in 45m',
      currentBid: 120,
      bidCount: 3,
    },
  ]


  // Calculate level based on user name (same logic as UserProfilesCarousel)
  const getUserLevel = () => {
    const names = userName.split(' ')
    const firstName = names[0] || ''
    const lastName = names[1] || ''
    
    // Special case: Emily gets level 9 (red)
    if (firstName.toLowerCase() === 'emily') {
      return 9
    }
    
    const fullName = firstName + lastName
    const hash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return 1 + (hash % 9) // Levels 1-9
  }

  const userLevel = getUserLevel()

  // Get current user from Better Auth
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const session = await authClient.getSession()
        console.log('🔍 [VIEW PROFILE] Better Auth session:', {
          hasSession: !!session,
          hasData: !!session?.data,
          hasSessionData: !!session?.data?.session,
          hasUser: !!session?.data?.user,
          fullSession: JSON.stringify(session, null, 2),
        })
        // Better Auth structure: session.data.user
        const user = (session?.data as any)?.user
        if (user) {
          console.log('✅ [VIEW PROFILE] User object:', {
            id: user.id,
            email: user.email,
            name: user.name,
            allKeys: Object.keys(user),
          })
          setCurrentUser(user)
        } else {
          console.warn('⚠️ [VIEW PROFILE] No user in session')
          console.warn('   Session structure:', {
            hasData: !!session?.data,
            dataKeys: session?.data ? Object.keys(session.data) : [],
            sessionData: session?.data,
          })
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }
    getCurrentUser()
  }, [])

  // Fetch store data
  const fetchStoreData = async () => {
    if (!storeId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/stores/${storeId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 [VIEW PROFILE] Fetched store data:', {
          store: data.store,
          storeUserId: data.store?.userId,
          user: data.user,
          userId: data.user?.id,
          userEmail: data.user ? '***' : undefined, // Don't log actual email
          listingsCount: data.listings?.length || 0,
        })
        // Merge user (level, currentXP, xpToNextLevel) into store so XP bar uses real data
        setStoreData({ ...data.store, user: data.user })
        setListings(data.listings || [])
      } else {
        console.error('❌ [VIEW PROFILE] Failed to fetch store:', response.status)
      }
    } catch (error) {
      console.error('❌ [VIEW PROFILE] Error fetching store:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStoreData()
  }, [storeId])

  // Fetch ISO items for this store (when viewing someone's profile)
  const fetchStoreIso = async () => {
    if (!storeId) return
    try {
      setIsoLoading(true)
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/stores/${storeId}/iso`)
      if (response.ok) {
        const data = await response.json()
        setIsoItems(data.isoItems || [])
      }
    } catch (e) {
      console.error('Error fetching store ISO:', e)
    } finally {
      setIsoLoading(false)
    }
  }

  useEffect(() => {
    fetchStoreIso()
  }, [storeId])

  // Fetch store reviews
  const fetchStoreReviews = async () => {
    if (!storeId) return
    try {
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/stores/${storeId}/reviews`)
      if (!response.ok) return
      const data = await response.json()
      const reviews = Array.isArray(data.reviews) ? data.reviews : []
      const mapped = reviews.map((r: any) => {
        const name = r.buyerFirstName || r.buyerLastName
          ? [r.buyerFirstName, r.buyerLastName].filter(Boolean).join(' ')
          : (r.buyerName || 'Buyer')
        const avatarSource = r.buyerAvatar ? { uri: r.buyerAvatar } : undefined
        return {
          id: r.id,
          reviewerName: name,
          reviewerAvatar: avatarSource,
          rating: Number(r.rating) || 0,
          date: new Date(r.createdAt).toLocaleDateString(),
          comment: r.comment,
        }
      })
      setStoreReviews(mapped)
    } catch (e) {
      console.error('Error fetching store reviews:', e)
    }
  }

  useEffect(() => {
    fetchStoreReviews()
  }, [storeId])

  // Sample store data fallback (if no storeId or API fails)
  const fallbackStoreData = {
    name: `${userName}'s Card Shop`,
    level: userLevel,
    currentXP: 450,
    xpToNextLevel: 600,
    salesCount: 12,
    totalSales: 12,
    totalRevenue: 1250,
    shareableLink: `saplayer.app/store/${userId}`,
    listings: [
      {
        id: '1',
        cardImage: require('../../assets/singles/Shining_Charizard_Secret.jpg'),
        cardName: 'Shining Charizard Secret',
        price: 165,
        vaultingStatus: 'vaulted' as const,
        purchaseType: 'both' as const,
        currentBid: 145,
        bidCount: 3,
      },
      {
        id: '2',
        cardImage: require('../../assets/singles/Mew.jpg'),
        cardName: 'Mew',
        price: 62,
        vaultingStatus: 'seller-has' as const,
        purchaseType: 'instant' as const,
        currentBid: 42,
        bidCount: 2,
      },
      {
        id: '3',
        cardImage: require('../../assets/singles/Blastoise_ex.jpg'),
        cardName: 'Blastoise EX',
        price: 95,
        vaultingStatus: 'vaulted' as const,
        purchaseType: 'both' as const,
        currentBid: 75,
        bidCount: 1,
      },
      {
        id: '4',
        cardImage: require('../../assets/singles/Umbreon_ex.jpg'),
        cardName: 'Umbreon EX',
        price: 110,
        vaultingStatus: 'vaulted' as const,
        purchaseType: 'instant' as const,
        currentBid: 90,
        bidCount: 4,
      },
      {
        id: '5',
        cardImage: require('../../assets/singles/Mega_Charizard_X.jpg'),
        cardName: 'Mega Charizard X',
        price: 215,
        vaultingStatus: 'seller-has' as const,
        purchaseType: 'both' as const,
        currentBid: 195,
        bidCount: 5,
      },
      {
        id: '6',
        cardImage: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg'),
        cardName: 'Hidden Fates Elite Trainer Box',
        price: 135,
        vaultingStatus: 'vaulted' as const,
        purchaseType: 'instant' as const,
        currentBid: 115,
        bidCount: 2,
      },
    ],
  }

  // Use real store data if available, otherwise use fallback. XP/level from API so bar is dynamic.
  const displayStoreData = storeData ? {
    name: storeData.storeName || `${userName}'s Card Shop`,
    level: storeData.user?.level != null ? Number(storeData.user.level) : userLevel,
    currentXP: storeData.user?.currentXP != null ? Number(storeData.user.currentXP) : 0,
    xpToNextLevel: storeData.user?.xpToNextLevel != null ? Number(storeData.user.xpToNextLevel) : 100,
    salesCount: storeData.salesCount ?? storeData.totalSales ?? 0,
    totalSales: storeData.totalSales || 0,
    totalRevenue: storeData.totalRevenue || 0,
    shareableLink: `saplayer.app/store/${storeId || userId}`,
    listings: listings.map((listing: any) => ({
      id: String(listing.id),
      listingId: listing.listingId ?? listing.id,
      cardImage: listing.cardImage
        ? { uri: listing.cardImage }
        : require('../../assets/singles/Shining_Charizard_Secret.jpg'),
      cardName: listing.cardName,
      cardId: listing.cardId,
      price: listing.price,
      quantity: listing.quantity,
      setName: listing.setName,
      cardNumber: listing.cardNumber,
      condition: listing.condition,
      metaLine: listing.metaLine,
      finishLabel: listing.finishLabel,
      marketPrice: listing.marketPrice,
      ebayLastSold: listing.ebayLastSold,
      vaultingStatus: listing.vaultingStatus,
      purchaseType: listing.purchaseType,
      currentBid: listing.currentBid,
      bidCount: listing.bidCount,
    })),
  } : fallbackStoreData

  if (loading && storeId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.textColor} />
        <Text style={[styles.emptyText, { marginTop: SPACING.md }]}>Loading store...</Text>
      </View>
    )
  }

  // Filter listings based on vaulted only
  const filteredListings = vaultedOnly
    ? displayStoreData.listings.filter(l => l.vaultingStatus === 'vaulted')
    : displayStoreData.listings

  const getInitials = () => {
    if (userInitials) return userInitials
    const names = userName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return userName.substring(0, 2).toUpperCase()
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
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <StoreHeader
          storeName={displayStoreData.name}
          bannerUrl={storeData?.bannerUrl ? { uri: storeData.bannerUrl } : (userId === 'alex-johnson' ? require('../../assets/banners/banner3.avif') : undefined)}
          profileImage={userImage || (storeData?.profileImage ? { uri: storeData.profileImage } : undefined)}
          profileInitials={getInitials()}
          level={displayStoreData.level}
          currentXP={displayStoreData.currentXP}
          xpToNextLevel={displayStoreData.xpToNextLevel}
          salesCount={displayStoreData.salesCount}
          shareableLink={displayStoreData.shareableLink}
          twitchUrl={storeData?.twitchUrl}
          youtubeUrl={storeData?.youtubeUrl}
        />

        <Section title="Store Stats">
          <StoreStats
            totalSales={displayStoreData.totalSales}
            totalRevenue={displayStoreData.totalRevenue}
            responseTime="2h"
            reviewPercentage={storeData?.rating ? Math.round(storeData.rating * 20) : 98}
          />
        </Section>

        {userAuctions.length > 0 && (
          <Section title="Auctions">
            <AuctionSection
              auctions={userAuctions}
              onAuctionPress={(auction) => {
                // TODO: Navigate to auction detail page
                console.log('Auction pressed:', auction.id)
              }}
              showCreateButton={false}
            />
          </Section>
        )}

        <Section
          title="Listings"
          rightContent={
            <SafetyFilter
              enabled={vaultedOnly}
              onToggle={setVaultedOnly}
              compact
            />
          }
        >
          <StoreListings
            listings={filteredListings}
            onListingPress={(listing: StoreListing) => {
              if (listing.cardImage) {
                const listingId = (listing as any).listingId ?? listing.id
                const sellerId = storeData?.userId ?? userId
                navigation.navigate('Product', {
                  name: listing.cardName,
                  image: listing.cardImage,
                  category: 'listing',
                  price: listing.price,
                  description: listing.cardName,
                  listingId: listingId != null ? String(listingId) : undefined,
                  sellerId: sellerId ?? undefined,
                  storeName: storeData?.storeName ?? storeData?.name ?? undefined,
                  cardId: listing.cardId ?? undefined,
                  setName: listing.setName,
                  cardNumber: listing.cardNumber,
                  purchaseType: listing.purchaseType ?? undefined,
                  currentBid: listing.currentBid != null ? Number(listing.currentBid) : undefined,
                })
              }
            }}
            onBuyPress={async (listing) => {
              // Ensure currentUser is loaded, if not, fetch it
              let user = currentUser
              if (!user || !user.id) {
                console.log('🔄 [VIEW PROFILE] User not loaded, fetching from Better Auth...')
                try {
                  const session = await authClient.getSession()
                  const userFromSession = (session?.data as any)?.user
                  if (userFromSession) {
                    user = userFromSession
                    setCurrentUser(userFromSession)
                    console.log('✅ [VIEW PROFILE] User loaded from session:', user.id)
                  } else {
                    console.error('❌ [VIEW PROFILE] Cannot buy - user not found in session')
                    Alert.alert('Error', 'Please log in to purchase items')
                    return
                  }
                } catch (error) {
                  console.error('❌ [VIEW PROFILE] Error fetching user:', error)
                  Alert.alert('Error', 'Please log in to purchase items')
                  return
                }
              }
              
              // Validate user has email
              if (!user.email) {
                console.error('❌ [VIEW PROFILE] User email not found:', user)
                Alert.alert('Error', 'User email not found. Please update your profile.')
                return
              }
              
              if (!storeData) {
                console.error('❌ [VIEW PROFILE] Cannot buy - store data not loaded')
                Alert.alert('Error', 'Store information not available')
                return
              }
              
              // Get sellerId from store
              const sellerId = storeData.userId || userId
              if (!sellerId) {
                console.error('❌ [VIEW PROFILE] Cannot buy - seller ID not found:', {
                  storeDataUserId: storeData.userId,
                  userId: userId,
                  storeData: storeData,
                })
                Alert.alert('Error', 'Seller information not available')
                return
              }
              
              // Get listingId
              const listingId = (listing as any).listingId || listing.id
              if (!listingId) {
                console.error('❌ [VIEW PROFILE] Cannot buy - listing ID not found:', listing)
                Alert.alert('Error', 'Listing information not available')
                return
              }
              
              console.log('✅ [VIEW PROFILE] Opening payment modal with:', {
                listingId,
                buyerId: user.id,
                sellerId,
                buyerEmail: user.email,
                storeData: storeData,
              })
              
              setSelectedListing(listing)
              setPaymentType('buy')
              setIsPaymentModalVisible(true)
            }}
            onBidPress={(listing) => {
              if (!currentUser || !currentUser.id) {
                console.error('❌ [VIEW PROFILE] Cannot bid - user not loaded:', {
                  hasCurrentUser: !!currentUser,
                  userId: currentUser?.id,
                })
                // TODO: Show login prompt
                return
              }
              if (!storeData) {
                console.error('❌ [VIEW PROFILE] Cannot bid - store data not loaded')
                return
              }
              setSelectedListing(listing)
              setPaymentType('bid')
              setIsPaymentModalVisible(true)
            }}
          />
        </Section>

        <Section title="In Search Of" compact>
          <CompactAccordion
            title="In Search Of"
            subtitle={
              isoLoading
                ? 'Loading…'
                : `${isoItems.length} ${isoItems.length === 1 ? 'card' : 'cards'}`
            }
            icon="search-outline"
            expanded={isoExpanded}
            onToggle={() => setIsoExpanded(!isoExpanded)}
          >
            {isoLoading ? (
              <View style={styles.isoLoadingWrap}>
                <ActivityIndicator size="small" color={theme.textColor} />
              </View>
            ) : isoItems.length === 0 ? (
              <Text style={styles.isoEmptyText}>No cards in search of</Text>
            ) : (
              isoItems.map((isoItem, index) => {
                const imageUri =
                  isoItem.image ||
                  getPokemonTcgImageUrlFromSetNumberIfOnCdn(isoItem.set, isoItem.cardNumber) ||
                  null
                return (
                  <View key={isoItem.id}>
                    <IsoListItem
                      item={isoItem}
                      imageUri={imageUri}
                      formatPrice={formatIsoPrice}
                    />
                    {index < isoItems.length - 1 ? <View style={styles.isoSeparator} /> : null}
                  </View>
                )
              })
            )}
          </CompactAccordion>
        </Section>

        <Section title="Reviews" compact>
          <CompactAccordion
            title="Customer Reviews"
            subtitle={
              storeReviews.length > 0
                ? `${storeReviews.length} reviews · ${(
                    storeReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / storeReviews.length
                  ).toFixed(1)} avg`
                : `${storeReviews.length} reviews`
            }
            icon="star-outline"
            expanded={reviewsExpanded}
            onToggle={() => setReviewsExpanded(!reviewsExpanded)}
          >
            {currentUser ? (
              <AppButton
                variant="outline"
                size="sm"
                onDarkSurface
                icon="chatbubble-outline"
                label="Leave a review"
                onPress={() => setIsLeaveReviewVisible(true)}
                style={styles.leaveReviewButton}
              />
            ) : null}
            {storeReviews.length === 0 ? (
              <Text style={styles.isoEmptyText}>No reviews yet</Text>
            ) : (
              <View style={styles.reviewsList}>
                {storeReviews.map((review) => (
                  <TouchableOpacity
                    key={review.id}
                    style={styles.reviewItem}
                    onPress={() => {
                      navigation.navigate('ViewProfile', {
                        userId: `user-${review.reviewerName.toLowerCase().replace(/\s+/g, '-')}`,
                        userName: review.reviewerName,
                        userImage: review.reviewerAvatar,
                        userInitials: review.reviewerName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase(),
                        verified: false,
                      })
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reviewHeader}>
                      <Image source={review.reviewerAvatar} style={styles.reviewerAvatar} />
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                        <View style={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.rating ? 'star' : 'star-outline'}
                              size={10}
                              color={theme.buttonFilledBg || '#FFFFFF'}
                            />
                          ))}
                          <Text style={styles.reviewDate}>{review.date}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </CompactAccordion>
        </Section>
      </ScrollView>

      {/* Leave Review Modal (from store page) */}
      {storeId && (
        <LeaveReviewModal
          visible={isLeaveReviewVisible}
          onClose={() => setIsLeaveReviewVisible(false)}
          onSubmit={async (rating, comment) => {
            const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
            const session = await authClient.getSession()
            const token = session?.data?.session?.token
            if (!token) {
              Alert.alert('Review', 'Please log in to leave a review.')
              return
            }
            const response = await fetch(`${baseUrl}/api/stores/${storeId}/reviews`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ rating, comment }),
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
              throw new Error(data.message || 'Failed to submit review')
            }
            await fetchStoreReviews()
          }}
        />
      )}

      {/* PayFast Payment Modal */}
      {selectedListing && (
        <PayFastPayment
          visible={isPaymentModalVisible}
          amount={
            paymentType === 'buy'
              ? (parseFloat(String(selectedListing.price)) || 0) + 100
              : (parseFloat(String(selectedListing.currentBid || selectedListing.price)) || 0) + 1
          }
          itemAmount={paymentType === 'buy' ? (parseFloat(String(selectedListing.price)) || 0) : undefined}
          shippingFee={paymentType === 'buy' ? 100 : undefined}
          itemName={selectedListing.cardName}
          itemDescription={selectedListing.cardName}
          userEmail={currentUser?.email || ''}
          userNameFirst={currentUser?.firstName || currentUser?.name?.split(' ')[0] || 'User'}
          userNameLast={currentUser?.lastName || currentUser?.name?.split(' ').slice(1).join(' ') || ''}
          listingId={(selectedListing as any).listingId || (typeof selectedListing.id === 'string' ? parseInt(selectedListing.id) : selectedListing.id) || undefined}
          buyerId={currentUser?.id || ''}
          sellerId={storeData?.userId || userId || ''}
          onClose={() => {
            setIsPaymentModalVisible(false)
            setSelectedListing(null)
          }}
          onSuccess={async (paymentData) => {
            console.log('✅ [VIEW PROFILE] Payment successful:', paymentData)
            // Refresh store data to show updated listings (removed sold card)
            await fetchStoreData()
            setIsPaymentModalVisible(false)
            setSelectedListing(null)
            // Prompt buyer to leave a review for this store
            setIsLeaveReviewVisible(true)
          }}
          onCancel={() => {
            console.log('Payment cancelled')
            setIsPaymentModalVisible(false)
            setSelectedListing(null)
          }}
          onError={(error) => {
            console.error('Payment error:', error)
            setIsPaymentModalVisible(false)
            setSelectedListing(null)
          }}
        />
      )}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
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
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.screenBottom,
  },
  reviewsList: {
    gap: SPACING.xs,
  },
  reviewItem: {
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  reviewerAvatar: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: 1,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  reviewDate: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: SPACING.xs,
  },
  reviewComment: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
  leaveReviewButton: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: SPACING.md,
  },
  isoLoadingWrap: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  isoEmptyText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: SPACING.xs,
  },
  isoSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: SPACING.xs,
  },
})
