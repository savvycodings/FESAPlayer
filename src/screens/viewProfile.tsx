import { useContext, useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../components/ui/text'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { Section } from '../components/layout/Section'
import { Card, CardContent } from '../components/ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { DOMAIN } from '../../constants'
import { authClient } from '../lib/auth-client'
import {
  StoreHeader,
  StoreStats,
  StoreListings,
  SafetyFilter,
} from '../components/store'
import { type StoreListing } from '../components/store/StoreListings'
import { AuctionSection, type Auction } from '../components/profile'
import { PayFastPayment } from '../components/payment'

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
  const [storeData, setStoreData] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedListing, setSelectedListing] = useState<StoreListing | null>(null)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [paymentType, setPaymentType] = useState<'buy' | 'bid'>('buy')

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
      description: 'New in box, never opened. Starting bid $120.',
      status: 'starting',
      timeRemaining: 'Starts in 45m',
      currentBid: 120,
      bidCount: 3,
    },
  ]

  // Sample reviews data
  const reviews = [
    {
      id: '1',
      reviewerName: 'Alex',
      reviewerAvatar: require('../../assets/Avatars/guy1.jpg'),
      rating: 5,
      date: '2 days ago',
      comment: 'Great seller! Fast shipping and card was exactly as described. Highly recommend!',
    },
    {
      id: '2',
      reviewerName: 'Sarah',
      reviewerAvatar: require('../../assets/Avatars/guy5.jpg'),
      rating: 5,
      date: '1 week ago',
      comment: 'Perfect condition, well packaged. Will definitely buy from again.',
    },
    {
      id: '3',
      reviewerName: 'Michael',
      reviewerAvatar: require('../../assets/Avatars/guy2.jpg'),
      rating: 4,
      date: '2 weeks ago',
      comment: 'Good communication and quick response. Card arrived safely.',
    },
    {
      id: '4',
      reviewerName: 'Emily',
      reviewerAvatar: require('../../assets/Avatars/guy4.jpg'),
      rating: 5,
      date: '3 weeks ago',
      comment: 'Excellent service! The card was in mint condition as promised.',
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
        setStoreData(data.store)
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

  // Use real store data if available, otherwise use fallback
  const displayStoreData = storeData ? {
    name: storeData.storeName || `${userName}'s Card Shop`,
    level: storeData.user?.level || userLevel,
    currentXP: storeData.user?.currentXP || 450,
    xpToNextLevel: storeData.user?.xpToNextLevel || 600,
    salesCount: storeData.salesCount || 0,
    totalSales: storeData.totalSales || 0,
    totalRevenue: storeData.totalRevenue || 0,
    shareableLink: `saplayer.app/store/${storeId || userId}`,
    listings: listings.map(listing => ({
      id: listing.id.toString(),
      listingId: listing.id, // Keep numeric ID for payment
      cardImage: listing.cardImage ? { uri: listing.cardImage } : require('../../assets/singles/Shining_Charizard_Secret.jpg'),
      cardName: listing.cardName,
      price: listing.price,
      vaultingStatus: listing.vaultingStatus,
      purchaseType: listing.purchaseType,
      currentBid: listing.currentBid,
      bidCount: listing.bidCount,
    })),
  } : fallbackStoreData

  if (loading && storeId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
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

        <Section title="In Search Of">
          <Card style={styles.isoCard}>
            <CardContent style={styles.isoCardContent}>
              <TouchableOpacity
                style={styles.isoHeader}
                onPress={() => setIsoExpanded(!isoExpanded)}
                activeOpacity={0.7}
              >
                <View style={styles.isoHeaderLeft}>
                  <View style={styles.isoIconContainer}>
                    <Ionicons name="search" size={20} color={theme.tintColor || '#73EC8B'} />
                  </View>
                  <View>
                    <Text style={styles.isoTitle}>Cards in Search Of</Text>
                    <Text style={styles.isoSubtitle}>{3} cards looking for</Text>
                  </View>
                </View>
                <Ionicons
                  name={isoExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </TouchableOpacity>

              {isoExpanded && (
                <View style={styles.isoContent}>
                  {[
                    {
                      cardName: 'Charizard ex',
                      cardNumber: '223/165',
                      set: 'Obsidian Flames',
                      image: require('../../assets/singles/Shining_Charizard_Secret.jpg'),
                    },
                    {
                      cardName: 'Pikachu VMAX',
                      cardNumber: '188/185',
                      set: 'Celebrations',
                      image: require('../../assets/singles/Mew.jpg'),
                    },
                    {
                      cardName: 'Mewtwo & Mew GX',
                      cardNumber: '71/236',
                      set: 'Unified Minds',
                      image: require('../../assets/singles/Mew.jpg'),
                    },
                  ].map((isoCard, index) => (
                    <View key={index}>
                      <View style={styles.isoItem}>
                        <View style={styles.isoItemLeft}>
                          <View style={styles.isoDetailRow}>
                            <Text style={styles.isoDetailLabel}>Card Name:</Text>
                            <Text style={styles.isoDetailValue}>{isoCard.cardName}</Text>
                          </View>
                          <View style={styles.isoDetailRow}>
                            <Text style={styles.isoDetailLabel}>Card Number:</Text>
                            <Text style={styles.isoDetailValue}>{isoCard.cardNumber}</Text>
                          </View>
                          <View style={styles.isoDetailRow}>
                            <Text style={styles.isoDetailLabel}>Set:</Text>
                            <Text style={styles.isoDetailValue}>{isoCard.set}</Text>
                          </View>
                        </View>
                        <View style={styles.isoItemRight}>
                          <Image
                            source={isoCard.image}
                            style={styles.isoCardImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                      {index < 2 && <View style={styles.isoSeparator} />}
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </Section>

        <Section title="Reviews">
          <Card style={styles.reviewsCard}>
            <CardContent style={styles.reviewsCardContent}>
              <TouchableOpacity
                style={styles.reviewsHeader}
                onPress={() => setReviewsExpanded(!reviewsExpanded)}
                activeOpacity={0.7}
              >
                <View style={styles.reviewsHeaderLeft}>
                  <View style={styles.reviewsIconContainer}>
                    <Ionicons name="star" size={20} color="#73EC8B" />
                  </View>
                  <View>
                    <Text style={styles.reviewsTitle}>Customer Reviews</Text>
                    <Text style={styles.reviewsSubtitle}>{reviews.length} reviews • 4.8 average</Text>
                  </View>
                </View>
                <Ionicons
                  name={reviewsExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </TouchableOpacity>

              {reviewsExpanded && (
                <View style={styles.reviewsList}>
                  {reviews.map((review) => (
                    <TouchableOpacity
                      key={review.id}
                      style={styles.reviewItem}
                      onPress={() => {
                        navigation.navigate('ViewProfile', {
                          userId: `user-${review.reviewerName.toLowerCase().replace(/\s+/g, '-')}`,
                          userName: review.reviewerName,
                          userImage: review.reviewerAvatar,
                          userInitials: review.reviewerName.split(' ').map(n => n[0]).join('').toUpperCase(),
                          verified: false,
                        })
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.reviewHeader}>
                        <Image
                          source={review.reviewerAvatar}
                          style={styles.reviewerAvatar}
                        />
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                          <View style={styles.reviewRating}>
                            {[...Array(5)].map((_, i) => (
                              <Ionicons
                                key={i}
                                name={i < review.rating ? "star" : "star-outline"}
                                size={12}
                                color={theme.tintColor || '#73EC8B'}
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
            </CardContent>
          </Card>
        </Section>

        <Section title="Listings">
          <SafetyFilter
            enabled={vaultedOnly}
            onToggle={setVaultedOnly}
          />
          <StoreListings
            listings={filteredListings}
            onListingPress={(listing: StoreListing) => {
              if (listing.cardImage) {
                navigation.navigate('Product', {
                  name: listing.cardName,
                  image: listing.cardImage,
                  category: 'listing',
                  price: listing.price,
                  description: `Premium ${listing.cardName}. Authentic and verified with secure shipping.`,
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
      </ScrollView>

      {/* PayFast Payment Modal */}
      {selectedListing && (
        <PayFastPayment
          visible={isPaymentModalVisible}
          amount={paymentType === 'buy' ? selectedListing.price : (selectedListing.currentBid || selectedListing.price) + 1}
          itemName={selectedListing.cardName}
          itemDescription={`Premium ${selectedListing.cardName}. Authentic and verified with secure shipping.`}
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: theme.backgroundColor,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING['4xl'],
  },
  reviewsCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  reviewsCardContent: {
    padding: SPACING.cardPadding,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reviewsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  reviewsSubtitle: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  reviewsList: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  reviewItem: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
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
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
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
  isoCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  isoCardContent: {
    padding: SPACING.cardPadding,
  },
  isoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  isoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  isoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  isoTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  isoSubtitle: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  isoContent: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  isoItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    minHeight: 80,
    alignItems: 'center',
  },
  isoItemLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  isoItemRight: {
    width: 60,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isoCardImage: {
    width: '100%',
    height: '100%',
  },
  isoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  isoDetailLabel: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    minWidth: 100,
  },
  isoDetailValue: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    flex: 1,
  },
  isoSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: SPACING.xs,
  },
})
