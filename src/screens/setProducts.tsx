import { useContext, useState, useMemo } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../components/ui/text'
import { Card, CardContent } from '../components/ui/card'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'

type SetProductsStackParamList = {
  SetProducts: {
    setName: string
    setImage: any
  }
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
  }
  ViewProfile: {
    userId?: string
    userName: string
    userImage?: any
    userInitials?: string
    verified?: boolean
  }
}

type SetProductsScreenRouteProp = RouteProp<SetProductsStackParamList, 'SetProducts'>
type SetProductsScreenNavigationProp = NativeStackNavigationProp<SetProductsStackParamList, 'SetProducts'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 50) / 3 // 3 columns with padding

// Helper function to determine set from product name
function getSetFromProductName(productName: string): string | null {
  const name = productName.toLowerCase().replace(/[-_]/g, '')
  
  if (name.includes('destined') && name.includes('rivals')) return 'destined-rivals'
  if (name.includes('phantasmal') && name.includes('flames')) return 'Phantasmal_Flames'
  if (name.includes('journey') && name.includes('together')) return 'journey-together'
  if (name.includes('obsidian') && name.includes('flames')) return 'obsidian-flames'
  if (name.includes('hidden') && name.includes('fates')) return 'hidden-fates'
  
  return null
}

// All available products - automatically matched to sets based on product names
const allProducts = [
  // Hidden Fates
  { name: 'Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg') },
  
  // Destined Rivals
  { name: 'Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box.jpg') },
  { name: 'Pokmon_TCG_Scarlet__Violet_Destined_Rivals_Sleeved_Booster_Pack_10_Cards', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet__Violet_Destined_Rivals_Sleeved_Booster_Pack_10_Cards.jpg') },
  { name: 'Pokmon_TCG_Scarlet__VioletDestined_Rivals_Booster_Display_Box_36_Packs', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet__VioletDestined_Rivals_Booster_Display_Box_36_Packs.jpg') },
  { name: 'Pokmon_Scarlet__Violet_10_Destined_Rivals_Booster', image: require('../../assets/products/pokevault/Pokmon_Scarlet__Violet_10_Destined_Rivals_Booster.webp') },
  { name: 'PokmonTCGScarletVioletDestinedRivalsBoosterBundle', image: require('../../assets/products/pokevault/PokmonTCGScarletVioletDestinedRivalsBoosterBundle.jpg') },
  
  // Phantasmal Flames
  { name: 'Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle.jpg') },
  { name: 'Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Display_Box_36_Packs', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Display_Box_36_Packs.jpg') },
  { name: 'Pokmon_TCG_Mega_Evolution_Pokmon_Center_Elite_Trainer_Box_Mega_Gardevoir', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Pokmon_Center_Elite_Trainer_Box_Mega_Gardevoir.jpg') },
  { name: 'Pokmon_TCG_Mega_Evolution_Pokmon_Center_Elite_Trainer_Box_Mega_Lucario', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Pokmon_Center_Elite_Trainer_Box_Mega_Lucario.jpg') },
  { name: 'Pokmon_TCG_Mega_EvolutionPhantasmal_Flames_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_EvolutionPhantasmal_Flames_Pokmon_Center_Elite_Trainer_Box.jpg') },
  { name: 'Pokmon_TCG_Mega_Evolution_Enhanced_Booster_Display_Box_36_Packs__1_Promo_Card', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Enhanced_Booster_Display_Box_36_Packs__1_Promo_Card.jpg') },
  
  // Journey Together
  { name: 'Pokmon_TCG_Scarlet__Violet_Journey_Together_Sleeved_Booster_Pack_10_Cards', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet__Violet_Journey_Together_Sleeved_Booster_Pack_10_Cards.jpg') },
  { name: 'Pokmon_Scarlet__Violet_9_Journey_Together_Booster_Pack', image: require('../../assets/products/pokevault/Pokmon_Scarlet__Violet_9_Journey_Together_Booster_Pack.webp') },
  { name: 'Pokmon_Scarlet__Violet_9_Journey_Together_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_Scarlet__Violet_9_Journey_Together_Elite_Trainer_Box.webp') },
  { name: 'Pokmon_Scarlet__Violet_9_Journey_Together__Premium_Blister__Klinklang', image: require('../../assets/products/pokevault/Pokmon_Scarlet__Violet_9_Journey_Together__Premium_Blister__Klinklang.webp') },
  { name: 'Pokmon_Scarlet__Violet_9_Journey_Together_Premium_Blister_Rhyperior', image: require('../../assets/products/pokevault/Pokmon_Scarlet__Violet_9_Journey_Together_Premium_Blister_Rhyperior.webp') },
  
  // Obsidian Flames
  { name: 'Pokmon_TCG_Scarlet__VioletObsidian_Flames_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet__VioletObsidian_Flames_Pokmon_Center_Elite_Trainer_Box.jpg') },
].map(product => ({
  ...product,
  set: getSetFromProductName(product.name)
})).filter(product => product.set !== null) // Only include products that match a set

// Top sellers data
const topSellers = [
  { first: 'Alex', last: 'Johnson', image: require('../../assets/Avatars/guy1.jpg'), verified: true },
  { first: 'Sarah', last: 'Martinez', image: require('../../assets/Avatars/guy5.jpg'), verified: true },
  { first: 'Michael', last: 'Chen', image: require('../../assets/Avatars/guy2.jpg'), verified: true },
  { first: 'Emily', last: 'Rodriguez', image: require('../../assets/Avatars/guy4.jpg'), verified: true },
  { first: 'David', last: 'Thompson', image: require('../../assets/Avatars/guy3.jpg'), verified: true },
]

export function SetProducts() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<SetProductsScreenNavigationProp>()
  const route = useRoute<SetProductsScreenRouteProp>()
  const { setName, setImage } = route.params || { setName: '', setImage: null }
  const styles = getStyles(theme)
  const [searchQuery, setSearchQuery] = useState('')

  const formatName = (name: string) => {
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Filter products by set name - match by set property or by product name containing set name
  const allSetProducts = allProducts.filter(product => {
    if (!product.set) return false
    
    const productSet = product.set.toLowerCase().replace(/[-_]/g, '')
    const selectedSet = setName.toLowerCase().replace(/[-_]/g, '')
    const productName = product.name.toLowerCase().replace(/[-_]/g, '')
    
    // Match if set property matches
    if (productSet === selectedSet) return true
    
    // Also check if product name contains the set name keywords
    if (selectedSet.includes('destined') && selectedSet.includes('rivals')) {
      return productName.includes('destined') && productName.includes('rivals')
    }
    if (selectedSet.includes('phantasmal') && selectedSet.includes('flames')) {
      return productName.includes('phantasmal') && productName.includes('flames')
    }
    if (selectedSet.includes('journey') && selectedSet.includes('together')) {
      return productName.includes('journey') && productName.includes('together')
    }
    if (selectedSet.includes('obsidian') && selectedSet.includes('flames')) {
      return productName.includes('obsidian') && productName.includes('flames')
    }
    if (selectedSet.includes('hidden') && selectedSet.includes('fates')) {
      return productName.includes('hidden') && productName.includes('fates')
    }
    
    return false
  })

  // Filter products by search query
  const setProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSetProducts
    }
    
    const query = searchQuery.toLowerCase().replace(/[-_]/g, ' ')
    return allSetProducts.filter(product => {
      const productName = formatName(product.name).toLowerCase()
      return productName.includes(query)
    })
  }, [allSetProducts, searchQuery])

  return (
    <View style={styles.container}>
      {/* Header with back button - Fixed at top */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={theme.textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Set Logo Card with White Background - Now scrolls with content */}
        {setImage && (
          <Card style={styles.logoCard}>
            <CardContent style={styles.logoCardContent}>
              <View style={styles.logoImageContainer}>
                <Image
                  source={setImage}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              
              {/* Top Sellers Avatars - Centered */}
              <View style={styles.sellersContainer}>
                <View style={styles.sellersRow}>
                  {topSellers.map((seller, index) => (
                    <View key={index} style={styles.sellerAvatarContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          navigation.navigate('ViewProfile', {
                            userId: `user-${seller.first.toLowerCase()}-${seller.last.toLowerCase()}`,
                            userName: seller.first,
                            userImage: seller.image,
                            userInitials: `${seller.first[0]}${seller.last[0]}`.toUpperCase(),
                            verified: false,
                          })
                        }}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={seller.image}
                          style={styles.sellerAvatar}
                        />
                      </TouchableOpacity>
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {seller.first}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchText}
              placeholder="Search products..."
              placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
              underlineColorAndroid="transparent"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Products Section */}
        {setProducts.length > 0 ? (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.productsSectionTitle}>Products</Text>
            </View>
            <View style={styles.productsGrid}>
              {setProducts.map((product, index) => {
                const formattedName = formatName(product.name)
                const isLastInRow = (index + 1) % 3 === 0
                const randomPrice = parseFloat((Math.random() * (500 - 25) + 25).toFixed(2))
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.productCardContainer,
                      isLastInRow && styles.productCardLast
                    ]}
                    onPress={() => {
                      navigation.navigate('Product', {
                        name: product.name,
                        image: product.image,
                        category: 'product',
                        price: randomPrice,
                        description: `Premium ${formattedName} product. Authentic and verified with secure shipping.`,
                      })
                    }}
                    activeOpacity={0.8}
                  >
                    <Card style={styles.productCard}>
                      <CardContent style={styles.productCardContent}>
                        <View style={styles.productImageContainer}>
                          <Image
                            source={product.image}
                            style={styles.productImage}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={styles.productTextContainer}>
                          <View>
                            <Text style={styles.productCardTitle} numberOfLines={2}>
                              {formattedName}
                            </Text>
                            <Text style={styles.productCardSubText}>Product</Text>
                          </View>
                          <Text style={styles.productCardPrice}>
                            ${randomPrice.toFixed(2)}
                          </Text>
                        </View>
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ) : (
          <Card style={styles.noProductsCard}>
            <CardContent style={styles.noProductsContent}>
              <View style={styles.noProductsContainer}>
                <Ionicons name="cube-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.noProductsText}>No products found for this set</Text>
              </View>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: SPACING.lg,
    paddingLeft: SPACING.containerPadding,
    paddingRight: SPACING.containerPadding,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING['3xl'] + 40, // Extra padding to account for back button (28px icon + 12px padding)
    paddingBottom: SPACING['4xl'],
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoCardContent: {
    padding: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
  },
  logoImageContainer: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  sellersContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  sellersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    gap: SPACING.xs,
  },
  sellerAvatarContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginBottom: SPACING.xs,
  },
  sellerName: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: '#000000',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchText: {
    flex: 1,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: TYPOGRAPHY.body,
    ...(Platform.OS === 'web' ? {
      outline: 'none',
      outlineWidth: 0,
      outlineStyle: 'none',
    } : {}),
  },
  clearButton: {
    marginLeft: SPACING.xs,
    padding: SPACING.xs / 2,
  },
  productsSection: {
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  productsSectionTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  productCardContainer: {
    width: PRODUCT_CARD_WIDTH,
    marginBottom: SPACING.lg,
    marginRight: 5,
  },
  productCardLast: {
    marginRight: 0,
  },
  productCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  productCardContent: {
    padding: 0,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productTextContainer: {
    padding: SPACING.sm,
    backgroundColor: theme.cardBackground || '#000000',
  },
  productCardTitle: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
    minHeight: 32,
  },
  productCardSubText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.sm,
  },
  productCardPrice: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  noProductsCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginTop: SPACING.md,
  },
  noProductsContent: {
    padding: SPACING['2xl'],
  },
  noProductsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noProductsText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
})
