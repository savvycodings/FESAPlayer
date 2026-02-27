import { View, StyleSheet, ScrollView } from 'react-native'
import { useContext, useCallback, useEffect, useState } from 'react'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import { Section } from '../components/layout/Section'
import { SPACING, TYPOGRAPHY } from '../constants/layout'
import {
  ShopHeader,
  PromoCarousel,
  VerifiedStoresCarousel,
  VerifiedStoreModal,
  CategoryBadges,
  RecentListings,
  VaultingSection,
  BlogCarousel,
} from '../components/shop'
import { Text } from '../components/ui/text'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'

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
  }
  SetProducts: {
    setName: string
    setImage: any
  }
}

type ShopScreenNavigationProp = NativeStackNavigationProp<ShopStackParamList, 'ShopMain'>

export function Shop() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ShopScreenNavigationProp>()
  const styles = getStyles(theme)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isVerifiedStoreModalVisible, setIsVerifiedStoreModalVisible] = useState(false)
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
  
  // Display name from profile API (updates when user edits name in Edit Profile)
  const [userName, setUserName] = useState<string>('User')

  const fetchProfileName = useCallback(async () => {
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) return
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const res = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.data.session.token}` },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data.user) return
      const u = data.user
      const first = u.firstName?.trim()
      const last = u.lastName?.trim()
      const fallback = u.name?.trim()
      setUserName([first, last].filter(Boolean).join(' ') || fallback || 'User')
    } catch (_) {
      setUserName('User')
    }
  }, [])

  useFocusEffect(useCallback(() => { fetchProfileName() }, [fetchProfileName]))

  // Fetch recent store listings from API
  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        setRecentListingsLoading(true)
        const res = await fetch(`${DOMAIN}/api/listings/recent?limit=24`)
        if (!res.ok) throw new Error('Failed to fetch recent listings')
        const data = await res.json()
        setRecentListings(data.listings || [])
      } catch (error) {
        console.error('Error fetching recent listings:', error)
        setRecentListings([])
      } finally {
        setRecentListingsLoading(false)
      }
    }
    fetchRecentListings()
  }, [])
  
  // Promotional carousel data
  const promoItems = [
    {
      title: 'Special Promotions in Stock',
      description: 'Limited time offers to help you build your collection.',
      buttonText: 'Shop Now',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg'),
    },
    {
      title: 'Flash Sale: Premium Singles',
      description: 'Perfect condition guaranteed with our authentication process.',
      buttonText: 'View Deals',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box.jpg'),
    },
    {
      title: 'New Arrivals: Sealed Products',
      description: 'Secure your favorite sets before they sell out.',
      buttonText: 'Explore',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle.jpg'),
    },
  ]
  
  // Blog carousel data
  const blogItems = [
    {
      title: 'How to Grade Your Cards',
      description: 'Learn the essential tips for getting your cards professionally graded.',
      buttonText: 'Read More',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_151_Booster_Bundle.jpg'),
      category: 'Grading',
    },
    {
      title: 'Investment Guide: Rare Cards',
      description: 'Discover which cards are worth investing in.',
      buttonText: 'Read More',
      image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_White_Flare_Pokmon_Center_Elite_Trainer_Box.jpg'),
      category: 'Investment',
    },
    {
      title: 'Card Storage Best Practices',
      description: 'Protect your collection with proper storage techniques.',
      buttonText: 'Read More',
      image: require('../../assets/singles/Shining_Charizard_Secret.jpg'),
      category: 'Storage',
    },
  ]
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'singles', label: 'Singles' },
    { id: 'sealed', label: 'Sealed' },
    { id: 'slabbed', label: 'Slabbed' },
  ]

  // Verified stores data - these are verified sellers users can buy from
  const verifiedStoresData = [
    { first: 'Alex', last: 'Johnson', image: require('../../assets/Avatars/guy1.jpg'), verified: true },
    { first: 'Sarah', last: 'Martinez', image: require('../../assets/Avatars/guy5.jpg'), verified: true },
    { first: 'Michael', last: 'Chen', image: require('../../assets/Avatars/guy2.jpg'), verified: true },
    { first: 'Emily', last: 'Rodriguez', image: require('../../assets/Avatars/guy4.jpg'), verified: true },
    { first: 'David', last: 'Thompson', image: require('../../assets/Avatars/guy3.jpg'), verified: true },
  ]
  
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
      <ShopHeader userName={userName} />

      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        <PromoCarousel items={promoItems} />

        <Section title="Verified User Stores">
          <VerifiedStoresCarousel 
            items={verifiedStoresData}
            onApplyPress={() => setIsVerifiedStoreModalVisible(true)}
          />
        </Section>

        <Section 
          title="Categories" 
          showSeeAll 
          onSeeAllPress={() => navigation.navigate('Search' as never)}
        >
          <CategoryBadges
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </Section>

        <Section title="Recent Listings">
          {recentListingsLoading ? (
            <View style={[styles.recentListingsPlaceholder, { paddingVertical: SPACING['2xl'] }]}>
              <Text style={[styles.recentListingsPlaceholderText, { color: theme.mutedForegroundColor }]}>
                Loading listings...
              </Text>
            </View>
          ) : (
            <RecentListings listings={filteredRecentListings} />
          )}
        </Section>

        <VaultingSection />

        <Section title="Blog" showSeeAll onSeeAllPress={() => {}}>
          <BlogCarousel items={blogItems} />
          </Section>
        </ScrollView>

        {/* Verified Store Modal */}
        <VerifiedStoreModal
          visible={isVerifiedStoreModalVisible}
          onClose={() => setIsVerifiedStoreModalVisible(false)}
          onPurchase={() => {
            // TODO: Handle purchase
            setIsVerifiedStoreModalVisible(false)
          }}
        />
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  recentListingsPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentListingsPlaceholderText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
  },
})
