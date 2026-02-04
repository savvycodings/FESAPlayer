import { useContext, useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Image,
  TextInput,
  Platform,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Carousel } from '../components/Carousel'
import { Section } from '../components/layout/Section'
import { Card, CardContent } from '../components/ui/card'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { DOMAIN } from '../../constants'

type SearchStackParamList = {
  SearchMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured'
    price?: number
    description?: string
  }
  Category: {
    categoryName: string
    categoryType: 'featured' | 'set'
    items: Array<{
      name: string
      image: any
    }>
  }
  SetProducts: {
    setName: string
    setImage: any
  }
  ViewProfile: {
    userId: string
    userName: string
    userImage?: any
    userInitials?: string
    verified?: boolean
  }
}

type SearchScreenNavigationProp = NativeStackNavigationProp<SearchStackParamList, 'SearchMain'>

export function Search() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<SearchScreenNavigationProp>()
  const styles = getStyles(theme)

  // Featured data with actual images and names
  const featuredData = [
    { name: 'pokemon', image: require('../../assets/fetuerd/pokemon.jpg') },
    { name: 'magic_the_gathering', image: require('../../assets/fetuerd/magic_the_gathering.jpg') },
    { name: 'flesh_and_blood', image: require('../../assets/fetuerd/flesh_and_blood.jpg') },
    { name: 'one_piece', image: require('../../assets/fetuerd/one_piece.jpg') },
    { name: 'Yu_Gi_Oh!', image: require('../../assets/fetuerd/Yu_Gi_Oh!.jpg') },
  ]
  const featuredItems = featuredData
  
  // Product data with actual images and names
  const productsData = [
    { name: 'Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle.jpg') },
    { name: 'Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box.jpg') },
    { name: 'Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg') },
    { name: 'Pokmon_TCG_Scarlet_Violet_White_Flare_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_White_Flare_Pokmon_Center_Elite_Trainer_Box.jpg') },
    { name: 'Pokmon_TCG_Scarlet_Violet_151_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_151_Booster_Bundle.jpg') },
  ]
  const productsItems = productsData
  
  // Set data with actual images and names
  const setsData = [
    { name: 'destined-rivals', image: require('../../assets/sets/pokimonlogo/destined-rivals.png') },
    { name: 'Phantasmal_Flames', image: require('../../assets/sets/pokimonlogo/Phantasmal_Flames.png') },
    { name: 'journey-together', image: require('../../assets/sets/pokimonlogo/journey-together.png') },
    { name: 'obsidian-flames', image: require('../../assets/sets/pokimonlogo/obsidian-flames.png') },
    { name: 'hidden-fates', image: require('../../assets/sets/pokimonlogo/hidden-fates.png') },
  ]
  const setsItems = setsData
  
  // Singles data with actual images and names
  const singlesData = [
    { name: 'Umbreon_ex', image: require('../../assets/singles/Umbreon_ex.jpg') },
    { name: 'Shining_Charizard_Secret', image: require('../../assets/singles/Shining_Charizard_Secret.jpg') },
    { name: 'Mew', image: require('../../assets/singles/Mew.jpg') },
    { name: 'Mega_Charizard_X', image: require('../../assets/singles/Mega_Charizard_X.jpg') },
    { name: 'Blastoise_ex', image: require('../../assets/singles/Blastoise_ex.jpg') },
  ]
  const singlesItems = singlesData

  const [searchQuery, setSearchQuery] = useState('')
  const [stores, setStores] = useState<Array<{
    id: number
    storeName: string
    profileImage?: string
    owner: {
      firstName?: string | null
      lastName?: string | null
      name?: string | null
      avatar?: string | null
    }
  }>>([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{
    featured: boolean
    sets: boolean
    products: boolean
    singles: boolean
  }>({
    featured: false,
    sets: false,
    products: false,
    singles: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Helper function to normalize names for searching
  const normalizeName = (name: string) => {
    return name.toLowerCase().replace(/[-_]/g, ' ').replace(/'/g, '').trim()
  }

  // Helper function to format display names
  const formatDisplayName = (name: string) => {
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Fetch stores when search query changes
  useEffect(() => {
    const fetchStores = async () => {
      // Only fetch if there's a query (backend will return matching stores)
      if (!searchQuery.trim() || searchQuery.length < 1) {
        setStores([])
        return
      }

      try {
        setStoresLoading(true)
        const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
        const response = await fetch(`${baseUrl}/api/stores/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📦 [SEARCH] Response data:', JSON.stringify(data, null, 2))
          console.log('📦 [SEARCH] Fetched stores:', data.stores?.length || 0, 'for query:', searchQuery)
          if (data.stores && data.stores.length > 0) {
            console.log('📦 [SEARCH] Store names:', data.stores.map((s: any) => s.storeName || s.owner?.name || 'Unknown').join(', '))
            console.log('📦 [SEARCH] First store details:', JSON.stringify(data.stores[0], null, 2))
          } else {
            console.log('⚠️ [SEARCH] No stores returned from backend')
          }
          setStores(data.stores || [])
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ [SEARCH] Failed to fetch stores:', response.status, errorData)
          setStores([])
        }
      } catch (error) {
        console.error('❌ [SEARCH] Error fetching stores:', error)
        setStores([])
      } finally {
        setStoresLoading(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchStores()
    }, 300) // Debounce search by 300ms

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Create searchable items array
  const allSearchableItems = useMemo(() => {
    const items: Array<{
      id: string
      name: string
      displayName: string
      image: any
      type: 'product' | 'set' | 'single' | 'featured' | 'store'
      originalItem: any
    }> = []

    // Add stores - include both store name and owner name for better search matching
    console.log('🏪 [SEARCH] Adding stores to searchable items:', stores.length)
    if (stores.length === 0) {
      console.log('⚠️ [SEARCH] No stores to add - stores array is empty')
    }
    stores.forEach((store, index) => {
      const storeName = store.storeName || ''
      const ownerFirstName = store.owner?.firstName || ''
      const ownerLastName = store.owner?.lastName || ''
      const ownerName = store.owner?.name || ''
      
      // Create a searchable name that includes all possible matches
      const searchableName = [storeName, ownerFirstName, ownerLastName, ownerName]
        .filter(Boolean)
        .join(' ')
      
      const storeDisplayName = store.storeName || `${ownerFirstName || ownerName || 'User'}'s Store`
      
      console.log(`🏪 [SEARCH] Store ${index + 1}:`, {
        id: store.id,
        displayName: storeDisplayName,
        searchableName: searchableName,
        storeName: storeName,
        owner: store.owner
      })
      
      items.push({
        id: `store-${store.id}`,
        name: searchableName || storeDisplayName, // Use searchable name for matching
        displayName: storeDisplayName, // Use display name for showing
        image: store.profileImage ? { uri: store.profileImage } : require('../../assets/Avatars/guy1.jpg'),
        type: 'store',
        originalItem: store,
      })
    })

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
  }, [productsItems, setsItems, singlesItems, featuredItems, stores])

  // Filter suggestions based on search query - prioritize stores and items that start with query
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = normalizeName(searchQuery)
    console.log('🔍 [SEARCH] Filtering suggestions for query:', query)
    console.log('🔍 [SEARCH] Total searchable items:', allSearchableItems.length)
    console.log('🔍 [SEARCH] Stores in searchable items:', allSearchableItems.filter(i => i.type === 'store').length)
    
    // Separate stores from other items
    const storeItems = allSearchableItems.filter(item => item.type === 'store')
    const otherItems = allSearchableItems.filter(item => item.type !== 'store')
    
    // For stores, show all that were returned by backend (they're already filtered)
    // For other items, filter by query match
    const matchingOtherItems = otherItems.filter(item => {
      const normalizedItemName = normalizeName(item.name)
      return normalizedItemName.includes(query)
    })
    
    // Combine: stores first (all of them since backend already filtered), then matching other items
    const allMatchingItems = [...storeItems, ...matchingOtherItems]
    
    console.log('🔍 [SEARCH] Matching items:', allMatchingItems.length)
    console.log('🔍 [SEARCH] Stores (from backend):', storeItems.length)
    console.log('🔍 [SEARCH] Other matching items:', matchingOtherItems.length)
    
    // Sort: stores first, then items that start with query, then items that contain query
    const sortedItems = allMatchingItems.sort((a, b) => {
      // Prioritize stores
      if (a.type === 'store' && b.type !== 'store') return -1
      if (a.type !== 'store' && b.type === 'store') return 1
      
      // Then prioritize items that start with query
      const aName = normalizeName(a.name)
      const bName = normalizeName(b.name)
      const aStarts = aName.startsWith(query)
      const bStarts = bName.startsWith(query)
      
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return 0
    })
    
    const result = sortedItems.slice(0, 10) // Limit to 10 suggestions
    console.log('🔍 [SEARCH] Final suggestions:', result.length, 'Stores:', result.filter(i => i.type === 'store').length)
    return result
  }, [searchQuery, allSearchableItems])

  // Helper function to render expanded grid items
  const renderExpandedItems = (
    items: Array<{ name: string; image: any }>,
    type: 'featured' | 'set' | 'product' | 'single'
  ) => {
    // Calculate how many items are visible in the carousel
    // itemWidth is 280px, with 12px spacing, screen width varies but typically shows 1-2 items
    // To be safe, we'll exclude the first 2 items that are most visible
    const itemsToSkip = 2
    const itemsToShow = items.slice(itemsToSkip)

    return (
      <View style={styles.expandedGrid}>
        {itemsToShow.map((item, index) => {
          const displayName = formatDisplayName(item.name)
          const viewCount = Math.floor(Math.random() * 500) + 100
          const itemCount = Math.floor(Math.random() * 20) + 5
          const searchCount = Math.floor(Math.random() * 300) + 50
          const productCount = Math.floor(Math.random() * 15) + 3
          const trendCount = Math.floor(Math.random() * 200) + 30
          const stockCount = Math.floor(Math.random() * 10) + 1
          const bidCount = Math.floor(Math.random() * 15) + 2
          const price = Math.floor(Math.random() * 200) + 50

          return (
            <TouchableOpacity
              key={index}
              style={styles.expandedItem}
              activeOpacity={0.8}
              onPress={() => {
                if (type === 'set') {
                  navigation.navigate('SetProducts', {
                    setName: item.name,
                    setImage: item.image,
                  })
                } else if (type === 'featured') {
                  const pokemonItem = featuredItems.find(f => f.name.toLowerCase() === 'pokemon')
                  if (pokemonItem) {
                    navigation.navigate('Category', {
                      categoryName: pokemonItem.name,
                      categoryType: 'set',
                      items: setsItems,
                    })
                  }
                } else {
                  navigation.navigate('Product', {
                    name: item.name,
                    image: item.image,
                    category: type,
                  })
                }
              }}
            >
              <Card style={styles.expandedCard}>
                <CardContent style={styles.expandedCardContent}>
                  <View style={type === 'featured' ? styles.featuredImageContainerFeatured : styles.featuredImageContainer}>
                    <Image
                      source={item.image}
                      style={styles.expandedImage}
                      resizeMode={type === 'featured' ? 'cover' : 'contain'}
                    />
                  </View>
                  {type === 'featured' && (
                    <TouchableOpacity 
                      style={styles.tournamentButton}
                      activeOpacity={0.7}
                      onPress={() => {
                        // TODO: Handle tournament navigation
                      }}
                    >
                      <Ionicons name="trophy-outline" size={14} color="#000000" />
                      <Text style={styles.tournamentButtonText}>Tournaments</Text>
                    </TouchableOpacity>
                  )}
                </CardContent>
              </Card>
              <View style={styles.itemNameContainer}>
                <Text style={styles.itemNameText} numberOfLines={1}>{displayName}</Text>
                <View style={styles.itemInfoContainer}>
                  {type === 'featured' && (
                    <>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="eye-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{viewCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="cube-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{itemCount}</Text>
                      </View>
                    </>
                  )}
                  {type === 'set' && (
                    <>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="search-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{searchCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="albums-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{productCount}</Text>
                      </View>
                    </>
                  )}
                  {type === 'product' && (
                    <>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="trending-up-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{trendCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="checkmark-circle-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{stockCount}</Text>
                      </View>
                    </>
                  )}
                  {type === 'single' && (
                    <>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="hand-left-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{bidCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="cash-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>${price}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  // Handle suggestion selection
  const handleSuggestionPress = (item: typeof allSearchableItems[0]) => {
    setSearchQuery('')
    
    if (item.type === 'store') {
      const store = item.originalItem
      const ownerName = store.owner?.firstName || store.owner?.name || store.storeName || 'User'
      const ownerInitials = store.owner?.firstName?.[0] || store.owner?.name?.[0] || store.storeName?.[0] || 'U'
      navigation.navigate('ViewProfile', {
        userId: store.userId?.toString() || '',
        userName: ownerName,
        userImage: store.profileImage ? { uri: store.profileImage } : undefined,
        userInitials: ownerInitials,
        verified: false,
        storeId: store.id, // Pass storeId to fetch store data
      })
    } else if (item.type === 'set') {
      navigation.navigate('SetProducts', {
        setName: item.originalItem.name,
        setImage: item.originalItem.image,
      })
    } else if (item.type === 'featured') {
      if (item.originalItem.name.toLowerCase() === 'pokemon') {
        navigation.navigate('Category', {
          categoryName: item.originalItem.name,
          categoryType: 'set',
          items: setsItems,
        })
      } else {
        navigation.navigate('Category', {
          categoryName: item.originalItem.name,
          categoryType: 'featured',
          items: featuredItems,
        })
      }
    } else {
      // Product or Single
      navigation.navigate('Product', {
        name: item.originalItem.name,
        image: item.originalItem.image,
        category: item.type,
      })
    }
  }

  return (
    <View style={styles.container}>
      {/* Search Bar - Fixed at top */}
      <View style={styles.topSearchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#E5E5E5"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchText}
            placeholder="Search"
            placeholderTextColor="#E5E5E5"
            underlineColorAndroid="transparent"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#E5E5E5" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Suggestions Dropdown - Overlay */}
      {searchSuggestions.length > 0 && searchQuery.length > 0 && (
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
                onPress={() => handleSuggestionPress(item)}
                activeOpacity={0.6}
              >
                <Ionicons 
                  name={item.type === 'store' ? 'storefront-outline' : 'search-outline'} 
                  size={18} 
                  color="rgba(255, 255, 255, 0.7)" 
                  style={styles.suggestionIcon} 
                />
                <Text style={styles.suggestionText} numberOfLines={1}>{item.displayName}</Text>
                {item.type === 'store' && (
                  <Text style={styles.suggestionTypeText}>Store</Text>
                )}
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
        {/* Featured Section */}
        <Section 
          title="Featured"
          showSeeAll={true}
          seeAllText={expandedSections.featured ? 'See less' : 'See all'}
          onSeeAllPress={() => toggleSection('featured')}
        >
          <Carousel
            items={featuredItems}
            renderItem={(item, index) => {
              const showBadge = index === 0
              const viewCount = Math.floor(Math.random() * 500) + 100
              const itemCount = Math.floor(Math.random() * 20) + 5
              const displayName = formatDisplayName(item.name)
              return (
                <View style={styles.carouselItemContainer}>
                  <Card style={styles.carouselCard}>
                    <CardContent style={styles.carouselCardContent}>
                      <View style={styles.featuredImageContainerFeatured}>
                        <Image
                          source={item.image}
                          style={styles.featuredImage}
                          resizeMode="cover"
                        />
                        {showBadge && (
                          <View style={styles.badgeContainer}>
                            <View style={styles.badgeSubtle}>
                              <Ionicons name="star" size={10} color="rgba(255, 255, 255, 0.9)" />
                              <Text style={styles.badgeTextSubtle}>Most Popular</Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.tournamentButton}
                        activeOpacity={0.7}
                        onPress={() => {
                          // TODO: Handle tournament navigation
                        }}
                      >
                        <Ionicons name="trophy-outline" size={14} color="#000000" />
                        <Text style={styles.tournamentButtonText}>Tournaments</Text>
                      </TouchableOpacity>
                    </CardContent>
                  </Card>
                  <View style={styles.itemNameContainer}>
                    <Text style={styles.itemNameText}>{displayName}</Text>
                    <View style={styles.itemInfoContainer}>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="eye-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{viewCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="cube-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{itemCount}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )
            }}
            itemWidth={280}
            itemHeight={280}
            itemSpacing={12}
            onItemPress={(item) => {
              // All featured items navigate to Pokemon category page
              const pokemonItem = featuredItems.find(f => f.name.toLowerCase() === 'pokemon')
              if (pokemonItem) {
                navigation.navigate('Category', {
                  categoryName: pokemonItem.name,
                  categoryType: 'set',
                  items: setsItems,
                })
              }
            }}
          />
          {expandedSections.featured && renderExpandedItems(featuredItems, 'featured')}
        </Section>

        {/* Sets Section */}
        <Section 
          title="Sets"
          showSeeAll={true}
          seeAllText={expandedSections.sets ? 'See less' : 'See all'}
          onSeeAllPress={() => toggleSection('sets')}
        >
          <Carousel
            items={setsItems}
            renderItem={(item, index) => {
              const setName = formatDisplayName(item.name)
              const showBadge = index === 0
              const searchCount = Math.floor(Math.random() * 300) + 50
              const productCount = Math.floor(Math.random() * 15) + 3
              return (
                <View style={styles.carouselItemContainer}>
                  <Card style={styles.carouselCard}>
                    <CardContent style={styles.carouselCardContent}>
                      <View style={styles.featuredImageContainer}>
                        <Image
                          source={item.image}
                          style={styles.featuredImage}
                          resizeMode="contain"
                        />
                        {showBadge && (
                          <View style={styles.badgeContainer}>
                            <View style={styles.badgeSubtle}>
                              <Ionicons name="search" size={10} color="rgba(255, 255, 255, 0.9)" />
                              <Text style={styles.badgeTextSubtle}>Most Searched</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </CardContent>
                  </Card>
                  <View style={styles.itemNameContainer}>
                    <Text style={styles.itemNameText}>{setName}</Text>
                    <View style={styles.itemInfoContainer}>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="search-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{searchCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="albums-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{productCount}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )
            }}
            itemWidth={280}
            itemHeight={250}
            itemSpacing={12}
            onItemPress={(item) => {
              navigation.navigate('SetProducts', {
                setName: item.name,
                setImage: item.image,
              })
            }}
          />
          {expandedSections.sets && renderExpandedItems(setsItems, 'set')}
        </Section>

        {/* Products Section */}
        <Section 
          title="Products"
          showSeeAll={true}
          seeAllText={expandedSections.products ? 'See less' : 'See all'}
          onSeeAllPress={() => toggleSection('products')}
        >
          <Carousel
            items={productsItems}
            renderItem={(item, index) => {
              let productName
              if (index === 0) {
                // First product: Phantasmal Flames Booster Bundle
                productName = 'Phantasmal Flames Booster Bundle'
              } else if (index === 1) {
                // Second product: Destined Rivals Elite Trainer Box
                productName = 'Destined Rivals Elite Trainer Box'
              } else if (index === 3) {
                // Fourth product: White Flare Elite Trainer Box
                productName = 'White Flare Elite Trainer Box'
              } else {
                productName = item.name
                  .replace(/Pokémon[-_]TCG[-_]/g, '')
                  .replace(/[-_]/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
              }
              const showBadge = index === 0
              const trendCount = Math.floor(Math.random() * 200) + 30
              const stockCount = Math.floor(Math.random() * 10) + 1
              return (
                <View style={styles.carouselItemContainer}>
                  <Card style={styles.carouselCard}>
                    <CardContent style={styles.carouselCardContent}>
                      <View style={styles.featuredImageContainer}>
                        <Image
                          source={item.image}
                          style={styles.featuredImage}
                          resizeMode="contain"
                        />
                        {showBadge && (
                          <View style={styles.badgeContainer}>
                            <View style={styles.badgeSubtle}>
                              <Ionicons name="trending-up" size={10} color="rgba(255, 255, 255, 0.9)" />
                              <Text style={styles.badgeTextSubtle}>Trending</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </CardContent>
                  </Card>
                  <View style={styles.itemNameContainer}>
                    <Text style={styles.itemNameText}>{productName}</Text>
                    <View style={styles.itemInfoContainer}>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="trending-up-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{trendCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="checkmark-circle-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{stockCount}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )
            }}
            itemWidth={280}
            itemHeight={250}
            itemSpacing={12}
            onItemPress={(item, index) => {
              navigation.navigate('Product', {
                name: item.name,
                image: item.image,
                category: 'product',
              })
            }}
          />
          {expandedSections.products && renderExpandedItems(productsItems, 'product')}
        </Section>

        {/* Singles Section */}
        <Section 
          title="Singles"
          showSeeAll={true}
          seeAllText={expandedSections.singles ? 'See less' : 'See all'}
          onSeeAllPress={() => toggleSection('singles')}
        >
          <Carousel
            items={singlesItems}
            renderItem={(item, index) => {
              const cardName = formatDisplayName(item.name)
              const showBadge = index === 0
              const bidCount = Math.floor(Math.random() * 15) + 2
              const price = Math.floor(Math.random() * 200) + 50
              return (
                <View style={styles.carouselItemContainer}>
                  <Card style={styles.carouselCard}>
                    <CardContent style={styles.carouselCardContent}>
                      <View style={styles.featuredImageContainer}>
                        <Image
                          source={item.image}
                          style={styles.featuredImage}
                          resizeMode="contain"
                        />
                        {showBadge && (
                          <View style={styles.badgeContainer}>
                            <View style={styles.badgeSubtle}>
                              <Ionicons name="flash" size={10} color="rgba(255, 255, 255, 0.9)" />
                              <Text style={styles.badgeTextSubtle}>Hot</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </CardContent>
                  </Card>
                  <View style={styles.itemNameContainer}>
                    <Text style={styles.itemNameText}>{cardName}</Text>
                    <View style={styles.itemInfoContainer}>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="hand-left-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>{bidCount}</Text>
                      </View>
                      <View style={styles.itemInfoItem}>
                        <Ionicons name="cash-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.itemInfoText}>${price}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )
            }}
            itemWidth={280}
            itemHeight={250}
            itemSpacing={12}
            onItemPress={(item) => {
              navigation.navigate('Product', {
                name: item.name,
                image: item.image,
                category: 'single',
              })
            }}
          />
          {expandedSections.singles && renderExpandedItems(singlesItems, 'single')}
        </Section>
      </ScrollView>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
    position: 'relative',
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING['4xl'],
  },
  topSearchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: theme.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    zIndex: 9999,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchText: {
    flex: 1,
    color: '#E5E5E5',
    fontFamily: theme.regularFont,
    fontSize: TYPOGRAPHY.body,
    marginLeft: SPACING.xs,
    ...(Platform.OS === 'web' ? {
      outline: 'none',
      outlineWidth: 0,
      outlineStyle: 'none',
    } : {}),
  },
  topButtonsContainer: {
    flexDirection: 'row',
  },
  plusButton: {
    borderRadius: 20,
  },
  plusButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselItemContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  carouselCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    width: '100%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  carouselCardContent: {
    padding: 0,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  featuredImageContainer: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  featuredImageContainerFeatured: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.backgroundColor,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 70,
    left: SPACING.containerPadding,
    right: SPACING.containerPadding,
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    borderRadius: RADIUS.lg,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  suggestionTypeText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: SPACING.sm,
  },
  badgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    zIndex: 10,
  },
  badgeSubtle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeTextSubtle: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  infoText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tournamentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.tintColor || '#73EC8B',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    margin: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  tournamentButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: '#000000',
    fontWeight: '600',
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    width: '100%',
  },
  itemNameText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: '#FFFFFF',
    flex: 1,
    flexShrink: 1,
  },
  itemInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginLeft: SPACING.sm,
  },
  itemInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  itemInfoText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  expandedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    justifyContent: 'space-between',
  },
  expandedItem: {
    width: '48%',
    marginBottom: SPACING.lg,
  },
  expandedCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  expandedCardContent: {
    padding: 0,
    width: '100%',
    height: '100%',
  },
  expandedImage: {
    width: '100%',
    height: '100%',
  },
})

