import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, Platform } from 'react-native'
import { useContext, useState, useMemo, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import { Section } from '../components/layout/Section'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import Ionicons from '@expo/vector-icons/Ionicons'
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

type ShopStackParamList = {
  ShopMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isVerifiedStoreModalVisible, setIsVerifiedStoreModalVisible] = useState(false)
  
  // Get user from Better Auth
  const [userName, setUserName] = useState<string>('User')
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          const user = session.data.user
          // Use name or email username
          const name = user.name || (user.email ? user.email.split('@')[0] : 'User')
          setUserName(name)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        // Keep default 'User' if error
      }
    }
    
    fetchUser()
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
  
  // Listing names mapped to indices
  const listingNames = [
    'Flareon Ex',
    '3 Slabed Pokemon Cards',
    'Celebrations Greninja',
    'zoroark Vstar',
    'mew duo ex',
    'umbreon and espeon ex'
  ]
  
  // Recent listings data with actual images and categories
  const recentListingsData = [
    { image: require('../../assets/recentlistings/recent1.jpg'), category: 'singles', nameIndex: 0 },
    { image: require('../../assets/recentlistings/recent2.jpg'), category: 'slabbed', nameIndex: 1 },
    { image: require('../../assets/recentlistings/recent3.jpg'), category: 'singles', nameIndex: 2 },
    { image: require('../../assets/recentlistings/recent4.jpg'), category: 'sealed', nameIndex: 3 },
    { image: require('../../assets/recentlistings/recent5.jpg'), category: 'singles', nameIndex: 4 },
    { image: require('../../assets/recentlistings/recent6.jpg'), category: 'slabbed', nameIndex: 5 },
  ]
  
  // Filter listings based on selected category
  const filteredListings = selectedCategory === 'all' 
    ? recentListingsData 
    : recentListingsData.filter(item => item.category === selectedCategory)

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

  // Helper function to normalize names for searching
  const normalizeName = (name: string) => {
    return name.toLowerCase().replace(/[-_]/g, ' ').trim()
  }

  // Helper function to format display names
  const formatDisplayName = (name: string) => {
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Create searchable items array
  const allSearchableItems = useMemo(() => {
    const items: Array<{
      id: string
      name: string
      displayName: string
      image: any
      type: 'product' | 'set' | 'single' | 'featured'
      originalItem: any
    }> = []

    // Add products
    productsItems.forEach(item => {
      items.push({
        id: `product-${item.name}`,
        name: item.name,
        displayName: formatDisplayName(item.name),
        image: item.image,
        type: 'product',
        originalItem: item,
      })
    })

    // Add sets
    setsItems.forEach(item => {
      items.push({
        id: `set-${item.name}`,
        name: item.name,
        displayName: formatDisplayName(item.name),
        image: item.image,
        type: 'set',
        originalItem: item,
      })
    })

    // Add singles
    singlesItems.forEach(item => {
      items.push({
        id: `single-${item.name}`,
        name: item.name,
        displayName: formatDisplayName(item.name),
        image: item.image,
        type: 'single',
        originalItem: item,
      })
    })

    // Add featured
    featuredItems.forEach(item => {
      items.push({
        id: `featured-${item.name}`,
        name: item.name,
        displayName: formatDisplayName(item.name),
        image: item.image,
        type: 'featured',
        originalItem: item,
      })
    })

    return items
  }, [productsItems, setsItems, singlesItems, featuredItems])

  // Filter suggestions based on search query - prioritize items that start with query
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = normalizeName(searchQuery)
    const matchingItems = allSearchableItems.filter(item => {
      const normalizedItemName = normalizeName(item.name)
      return normalizedItemName.includes(query)
    })
    
    // Sort: items that start with query first, then items that contain query
    const sortedItems = matchingItems.sort((a, b) => {
      const aName = normalizeName(a.name)
      const bName = normalizeName(b.name)
      const aStarts = aName.startsWith(query)
      const bStarts = bName.startsWith(query)
      
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return 0
    })
    
    return sortedItems.slice(0, 10) // Limit to 10 suggestions
  }, [searchQuery, allSearchableItems])

  // Handle suggestion selection
  const handleSuggestionPress = (item: typeof allSearchableItems[0]) => {
    setSearchQuery('')
    
    if (item.type === 'set') {
      // Navigate to SetProducts page for sets
      navigation.navigate('SetProducts', {
        setName: item.originalItem.name,
        setImage: item.originalItem.image,
      })
    } else {
      // Navigate to Product page for other types
      navigation.navigate('Product', {
        name: item.originalItem.name,
        image: item.originalItem.image,
        category: item.type === 'featured' ? 'product' : item.type,
      })
    }
  }

  return (
    <View style={styles.container}>
      <ShopHeader 
        userName={userName}
        isSearchExpanded={isSearchExpanded}
        searchQuery={searchQuery}
        onSearchToggle={() => {
          setIsSearchExpanded(!isSearchExpanded)
          if (isSearchExpanded) {
            setSearchQuery('')
          }
        }}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
      />

      {/* Search Suggestions Dropdown - Overlay */}
      {isSearchExpanded && searchSuggestions.length > 0 && searchQuery.length > 0 && (
        <View style={styles.suggestionsDropdown}>
          <FlatList
            data={searchSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  index === searchSuggestions.length - 1 && styles.suggestionItemLast
                ]}
                onPress={() => {
                  handleSuggestionPress(item)
                  setIsSearchExpanded(false)
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="search-outline" size={18} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.7)'} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText} numberOfLines={1}>{item.displayName}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={null}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

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
          <RecentListings
            listings={filteredListings}
            listingNames={listingNames}
          />
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
  suggestionsDropdown: {
    position: 'absolute',
    top: 80,
    left: SPACING.containerPadding,
    right: SPACING.containerPadding,
    backgroundColor: theme.backgroundColor || 'rgba(20, 20, 20, 0.98)',
    borderRadius: RADIUS.lg,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 9999,
    zIndex: 9999,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.06)',
    minHeight: 48,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: SPACING.md,
    opacity: 0.7,
  },
  suggestionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    letterSpacing: 0.1,
  },
})
