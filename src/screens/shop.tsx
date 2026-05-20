import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useContext, useCallback, useEffect, useState, useRef } from 'react'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import { Section } from '../components/layout/Section'
import { SPACING, TYPOGRAPHY } from '../constants/layout'
import {
  ShopHeader,
  PromoCarousel,
  VerifiedStoresCarousel,
  RecentListings,
  VaultingSection,
  BlogCarousel,
} from '../components/shop'
import type { PromoItem } from '../components/shop/PromoCarousel'
import { Text } from '../components/ui/text'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'
import { BLOG_POSTS, type BlogPost } from '../data/blogPosts'
import type { ShopStackParamList } from '../navigation/shopStackTypes'

type ShopScreenNavigationProp = NativeStackNavigationProp<ShopStackParamList, 'ShopMain'>

export function Shop() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ShopScreenNavigationProp>()
  const styles = getStyles(theme)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [recentListings, setRecentListings] = useState<Array<{
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
  }>>([])
  const [recentListingsLoading, setRecentListingsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [verifiedStores, setVerifiedStores] = useState<Array<{
    id: number
    userId: string
    storeName?: string | null
    profileImage?: string | null
    verificationLevel?: string | null
    owner?: { firstName?: string | null; lastName?: string | null; name?: string | null; avatar?: string | null }
  }>>([])
  const [verifiedStoresLoading, setVerifiedStoresLoading] = useState(true)
  const scrollViewRef = useRef<ScrollView>(null)
  const recentListingsSectionRef = useRef<View>(null)
  const recentListingsSectionY = useRef(0)

  const captureRecentListingsY = useCallback(() => {
    recentListingsSectionRef.current?.measureLayout(
      scrollViewRef.current as any,
      (_x: number, y: number) => { recentListingsSectionY.current = y }
    )
  }, [])

  // Display name + portfolio from profile API (same sources as Profile tab)
  const [userName, setUserName] = useState<string>('User')
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioHistory, setPortfolioHistory] = useState<{ x: number; y: number }[]>([])

  const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

  const fetchShopHeader = useCallback(async () => {
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        setUserName('User')
        setPortfolioValue(0)
        setPortfolioHistory([])
        return
      }
      const token = session.data.session.token
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const [userRes, collectionsRes, historyRes] = await Promise.all([
        fetch(`${baseUrl}/api/profile/user`, { method: 'GET', headers, credentials: 'include' }),
        fetch(`${baseUrl}/api/profile/collections`, { method: 'GET', headers, credentials: 'include' }),
        fetch(`${baseUrl}/api/profile/portfolio/history?days=90`, { method: 'GET', headers, credentials: 'include' }),
      ])

      const userData = await userRes.json()
      if (userRes.ok && userData.user) {
        const u = userData.user
        const first = u.firstName?.trim()
        const last = u.lastName?.trim()
        const fallback = u.name?.trim()
        setUserName([first, last].filter(Boolean).join(' ') || fallback || 'User')
      }

      const collectionsData = await collectionsRes.json()
      if (collectionsRes.ok) {
        setPortfolioValue(Number(collectionsData.portfolioValue) || 0)
      } else {
        setPortfolioValue(0)
      }

      const historyData = await historyRes.json()
      if (historyRes.ok && Array.isArray(historyData.history) && historyData.history.length > 0) {
        const points = historyData.history.map((h: { totalMarketPriceUsd?: number | null }, index: number) => {
          const usd = h.totalMarketPriceUsd != null ? Number(h.totalMarketPriceUsd) : 0
          const valueZar = usd > 0 ? Math.round(usd * USD_TO_ZAR) : 0
          return { x: index, y: valueZar }
        })
        setPortfolioHistory(points)
      } else {
        setPortfolioHistory([])
      }
    } catch (_) {
      setUserName('User')
      setPortfolioValue(0)
      setPortfolioHistory([])
    }
  }, [USD_TO_ZAR])

  useFocusEffect(useCallback(() => { fetchShopHeader() }, [fetchShopHeader]))

  // Fetch recent store listings from API
  const fetchRecentListings = useCallback(async () => {
    try {
      setRecentListingsLoading(true)
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const res = await fetch(`${baseUrl}/api/listings/recent?limit=24`)
      if (!res.ok) throw new Error('Failed to fetch recent listings')
      const data = await res.json()
      setRecentListings(data.listings || [])
    } catch (error) {
      console.error('Error fetching recent listings:', error)
      setRecentListings([])
    } finally {
      setRecentListingsLoading(false)
    }
  }, [])

  const fetchVerifiedStores = useCallback(async () => {
    try {
      setVerifiedStoresLoading(true)
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const res = await fetch(`${baseUrl}/api/stores/verified?limit=12`)
      if (!res.ok) throw new Error('Failed to fetch verified stores')
      const data = await res.json()
      setVerifiedStores(data.stores || [])
    } catch (error) {
      console.error('Error fetching verified stores:', error)
      setVerifiedStores([])
    } finally {
      setVerifiedStoresLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentListings()
  }, [fetchRecentListings])

  useEffect(() => {
    fetchVerifiedStores()
  }, [fetchVerifiedStores])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchShopHeader(), fetchRecentListings(), fetchVerifiedStores()])
    } finally {
      setRefreshing(false)
    }
  }, [fetchShopHeader, fetchRecentListings, fetchVerifiedStores])
  
  // Promotional carousel data – each promo links to a product or set page
  const promoItems: PromoItem[] = [
    {
      title: 'Special Promotions in Stock',
      description: 'Limited time offers to help you build your collection.',
      buttonText: 'Shop Now',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg'),
      action: { type: 'product', name: 'Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg'), category: 'product' },
    },
    {
      title: 'Flash Sale: Premium Singles',
      description: 'Perfect condition guaranteed with our authentication process.',
      buttonText: 'View Deals',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box.jpg'),
      action: { type: 'set', setName: 'destined-rivals', setImage: require('../../assets/sets/pokimonlogo/destined-rivals.png') },
    },
    {
      title: 'New Arrivals: Sealed Products',
      description: 'Secure your favorite sets before they sell out.',
      buttonText: 'Explore',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle.jpg'),
      action: { type: 'product', name: 'Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle.jpg'), category: 'product' },
    },
  ]

  const handlePromoButtonPress = useCallback((item: PromoItem) => {
    const action = item.action
    if (!action) return
    if (action.type === 'category') {
      setSelectedCategory(action.categoryId)
      const y = recentListingsSectionY.current
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 40), animated: true })
    } else if (action.type === 'product') {
      navigation.navigate('Product', {
        name: action.name,
        image: action.image,
        category: action.category ?? 'product',
      })
    } else if (action.type === 'set') {
      navigation.navigate('SetProducts', {
        setName: action.setName,
        setImage: action.setImage,
      })
    }
  }, [navigation])

  const handleBlogPress = useCallback(
    (item: BlogPost) => {
      navigation.navigate('BlogPost', { id: item.id })
    },
    [navigation],
  )

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'singles', label: 'Singles' },
    { id: 'sealed', label: 'Sealed' },
    { id: 'slabbed', label: 'Slabbed' },
  ]

  // Map API verified stores to carousel items (real stores); fallback to placeholder if none
  const defaultStoreAvatar = require('../../assets/Avatars/guy1.jpg')
  const verifiedStoresData = verifiedStoresLoading
    ? []
    : verifiedStores.length > 0
      ? verifiedStores.map((store) => {
          const storeName = store.storeName?.trim() || [store.owner?.firstName, store.owner?.lastName].filter(Boolean).join(' ') || store.owner?.name?.trim() || 'Store'
          return {
            first: storeName,
            last: '',
            image: store.profileImage ? { uri: store.profileImage } : defaultStoreAvatar,
            verified: true,
            userId: store.userId,
            storeId: store.id,
            verificationLevel: store.verificationLevel ?? 'bronze',
          }
        })
      : []
  
  // Filter recent listings by category (vaulted = slabbed, else singles for now; schema has no category)
  const filteredRecentListings = selectedCategory === 'all'
    ? recentListings
    : selectedCategory === 'slabbed'
      ? recentListings.filter(l => l.vaultingStatus === 'vaulted')
      : recentListings.filter(l => l.vaultingStatus !== 'vaulted')

  // Search data - same as search page
  const featuredData = [
    { name: 'pokemon', image: require('../../assets/fetuerd/pokemon.jpg') },
    { name: 'magic_the_gathering', image: require('../../assets/fetuerd/magic_the_gathering.jpg') },
    { name: 'flesh_and_blood', image: require('../../assets/fetuerd/flesh_and_blood.jpg') },
    { name: 'one_piece', image: require('../../assets/fetuerd/one_piece.jpg') },
    { name: 'Yu_Gi_Oh!', image: require('../../assets/fetuerd/Yu_Gi_Oh!.jpg') },
  ]
  const featuredItems = featuredData
  
  const productsData = [
    { name: 'Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle.jpg') },
    { name: 'Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box.jpg') },
    { name: 'Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg') },
    { name: 'Pokmon_TCG_Scarlet_Violet_White_Flare_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_White_Flare_Pokmon_Center_Elite_Trainer_Box.jpg') },
    { name: 'Pokmon_TCG_Scarlet_Violet_151_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_151_Booster_Bundle.jpg') },
  ]
  const productsItems = productsData
  
  const setsData = [
    { name: 'destined-rivals', image: require('../../assets/sets/pokimonlogo/destined-rivals.png') },
    { name: 'Phantasmal_Flames', image: require('../../assets/sets/pokimonlogo/Phantasmal_Flames.png') },
    { name: 'journey-together', image: require('../../assets/sets/pokimonlogo/journey-together.png') },
    { name: 'obsidian-flames', image: require('../../assets/sets/pokimonlogo/obsidian-flames.png') },
    { name: 'hidden-fates', image: require('../../assets/sets/pokimonlogo/hidden-fates.png') },
  ]
  const setsItems = setsData
  
  const singlesData = [
    { name: 'Umbreon_ex', image: require('../../assets/singles/Umbreon_ex.jpg') },
    { name: 'Shining_Charizard_Secret', image: require('../../assets/singles/Shining_Charizard_Secret.jpg') },
    { name: 'Mew', image: require('../../assets/singles/Mew.jpg') },
    { name: 'Mega_Charizard_X', image: require('../../assets/singles/Mega_Charizard_X.jpg') },
    { name: 'Blastoise_ex', image: require('../../assets/singles/Blastoise_ex.jpg') },
  ]
  const singlesItems = singlesData

  return (
    <View style={styles.container}>
      <ShopHeader
        userName={userName}
        portfolioValue={portfolioValue}
        portfolioHistory={portfolioHistory}
      />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textColor}
          />
        }
      >
        <PromoCarousel items={promoItems} onButtonPress={handlePromoButtonPress} />

        <Section title="Verified User Stores" compact style={styles.verifiedStoresSection}>
          {verifiedStoresLoading ? (
            <View style={[styles.recentListingsPlaceholder, { paddingVertical: SPACING.lg }]}>
              <Text style={[styles.recentListingsPlaceholderText, { color: theme.mutedForegroundColor }]}>
                Loading verified stores...
              </Text>
            </View>
          ) : verifiedStoresData.length === 0 ? (
            <View style={[styles.recentListingsPlaceholder, { paddingVertical: SPACING.lg }]}>
              <Text style={[styles.recentListingsPlaceholderText, { color: theme.mutedForegroundColor }]}>
                No verified stores yet.
              </Text>
            </View>
          ) : (
            <VerifiedStoresCarousel items={verifiedStoresData} />
          )}
        </Section>

        <View ref={recentListingsSectionRef} onLayout={captureRecentListingsY}>
          <Section title="Recent Listings" compact>
            {recentListingsLoading ? (
              <View style={[styles.recentListingsPlaceholder, { paddingVertical: SPACING.lg }]}>
                <Text style={[styles.recentListingsPlaceholderText, { color: theme.mutedForegroundColor }]}>
                  Loading listings...
                </Text>
              </View>
            ) : (
              <RecentListings listings={filteredRecentListings} />
            )}
          </Section>
        </View>

        <VaultingSection />

        <Section
          title="Blog"
          compact
          showSeeAll
          onSeeAllPress={() => navigation.navigate('BlogList')}
        >
          <BlogCarousel items={BLOG_POSTS} onItemPress={handleBlogPress} />
        </Section>
        </ScrollView>

      </View>
    )
  }

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.screenBottom,
  },
  recentListingsPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentListingsPlaceholderText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
  },
  verifiedStoresSection: {
    marginTop: SPACING.xl,
  },
})
