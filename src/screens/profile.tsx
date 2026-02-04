import React, { useContext, useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../components/ui/text'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ProfileHeader, ProductGrid, GoalProgress, SetChart, ListItemModal, AddCardModal, BulkVaultingModal } from '../components/profile'
import { Section } from '../components/layout/Section'
import { DOMAIN } from '../../constants'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage, isExternalUrl } from '../utils/imageUpload'
import { authClient } from '../lib/auth-client'

type ProfileStackParamList = {
  ProfileMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
  }
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

export function Profile() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ProfileScreenNavigationProp>()
  const styles = getStyles(theme)
  const [isListItemModalVisible, setIsListItemModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; image?: any; id?: number } | null>(null)

  // State for user data
  const [user, setUser] = useState<any>(null)
  const [collections, setCollections] = useState<any[]>([])
  const [stats, setStats] = useState({ cards: 0, sealed: 0, slabs: 0, total: 0 })
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [portfolioData, setPortfolioData] = useState<{ x: number; y: number }[]>([])
  const [setDistribution, setSetDistribution] = useState<{ label: string; value: number }[]>([])
  const [isAddCardModalVisible, setIsAddCardModalVisible] = useState(false)
  const [isBulkVaultingModalVisible, setIsBulkVaultingModalVisible] = useState(false)

  // Fetch user profile data using Better Auth session
  const fetchUserProfile = async () => {
    try {
      // Get session from Better Auth
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        Alert.alert('Error', 'Please log in to view your profile')
        return
      }

      // Get session token for API calls (Expo/mobile needs this)
      const sessionToken = session.data.session.token

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`, // Send session token for mobile
        },
        credentials: 'include', // Include cookies for web
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
      } else {
        console.error('Error fetching user profile:', data.message)
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Fetch collections
  const fetchCollections = async () => {
    try {
      setLoading(true)
      // Check session
      const session = await authClient.getSession()
      if (!session?.data?.session) return

      // Get session token for API calls
      const sessionToken = session.data.session.token

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/collections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`, // Send session token for mobile
        },
        credentials: 'include', // Include cookies for web
      })

      const data = await response.json()

      if (response.ok) {
        const collectionsData = data.collections || []
        setCollections(collectionsData)
        setStats(data.stats || { cards: 0, sealed: 0, slabs: 0, total: 0 })
        setPortfolioValue(data.portfolioValue || 0)

        // Set distribution from API
        const distribution = (data.setDistribution || []).map((item: any) => ({
          label: item.label,
          value: item.value,
        }))
        setSetDistribution(distribution)

        // Portfolio graph data - show current portfolio value if available
        // For single-day view, show just one point representing today
        if (data.portfolioValue > 0) {
          // Show current value as a single point (today only)
          // When historical data is added, this will expand to show trends
          setPortfolioData([
            { x: 0, y: data.portfolioValue },
          ])
        } else {
          // No portfolio value - empty array (will show empty state)
          setPortfolioData([])
        }
      } else {
        console.error('Error fetching collections:', data.message)
        // Set defaults on error
        setCollections([])
        setStats({ cards: 0, sealed: 0, slabs: 0, total: 0 })
        setPortfolioValue(0)
        setSetDistribution([])
        setPortfolioData([])
      }
    } catch (error: any) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add card to collection
  const addCardToCollection = async (data: {
    type: 'card' | 'sealed' | 'slab'
    name: string
    description?: string
    image?: string
    cardId?: string
    set?: string
    condition?: string
    grade?: number
    estimatedValue?: number
    purchasePrice?: number
    purchaseDate?: string
    notes?: string
    requestVaulting?: boolean
  }) => {
    try {
      // Check session
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        Alert.alert('Error', 'Please log in')
        return
      }

      // Get session token
      const sessionToken = session.data.session.token

      // ALWAYS ensure image is uploaded to Cloudinary (never save local file paths)
      let imageUrl = data.image
      if (data.image) {
        if (!isExternalUrl(data.image)) {
          // Local file (file:// or blob:) - MUST upload to Cloudinary
          try {
            imageUrl = await uploadImage(data.image, 'gradeit/collections')
          } catch (error: any) {
            const errorMessage = error.message || 'Failed to upload card image'
            
            // Check if it's a size error
            if (errorMessage.includes('too large') || errorMessage.includes('PayloadTooLarge')) {
              throw new Error('Image is too large. Please choose a smaller image (under 3.5MB).')
            } else {
              throw new Error(errorMessage)
            }
          }
        }
        // If already external (Cloudinary URL), use it as-is
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`, // Send session token for mobile
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          ...data,
          image: imageUrl,
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        // Refresh collections and user data
        await fetchCollections()
        await fetchUserProfile()
        // Don't show alert here - let the modal handle success and close
        // The modal will show success message and close itself
      } else {
        // Throw error so modal can handle it
        throw new Error(responseData.message || 'Failed to add card')
      }
    } catch (error: any) {
      console.error('Error adding card:', error)
      // Re-throw error so modal can handle it and show error message
      throw error
    }
  }

  // Create listing from collection item
  const createListing = async (cardName: string, price: number, cardImage?: any) => {
    try {
      // Check session
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        Alert.alert('Error', 'Please log in')
        return
      }

      // Get session token
      const sessionToken = session.data.session.token

      // ALWAYS ensure image is uploaded to Cloudinary (never save local file paths)
      let imageUrl: string | null = null
      const imageUri = cardImage?.uri || (typeof cardImage === 'string' ? cardImage : null)
      
      if (imageUri) {
        if (isExternalUrl(imageUri)) {
          // Already a Cloudinary/external URL - use as-is
          imageUrl = imageUri
        } else {
          // Local file (file:// or blob:) - MUST upload to Cloudinary
          try {
            imageUrl = await uploadImage(imageUri, 'gradeit/listings')
          } catch (error: any) {
            Alert.alert('Upload Error', error.message || 'Failed to upload listing image')
            return
          }
        }
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`, // Send session token for mobile
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          cardName,
          price,
          cardImage: imageUrl,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert('Success', 'Listing created successfully! It will appear in your store.')
        // Refresh collections to update isListed status
        await fetchCollections()
      } else {
        Alert.alert('Error', data.message || 'Failed to create listing')
      }
    } catch (error: any) {
      console.error('Error creating listing:', error)
      Alert.alert('Error', 'Failed to create listing')
    }
  }

  // Request vaulting for multiple cards
  const requestBulkVaulting = async (collectionIds: number[]) => {
    try {
      // Check session
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        Alert.alert('Error', 'Please log in')
        return
      }

      // Get session token
      const sessionToken = session.data.session.token

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/vaulting/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`, // Send session token for mobile
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          collectionIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert('Success', `Vaulting request created for ${collectionIds.length} ${collectionIds.length === 1 ? 'card' : 'cards'}!`)
        // Refresh collections
        await fetchCollections()
      } else {
        Alert.alert('Error', data.message || 'Failed to create vaulting request')
      }
    } catch (error: any) {
      console.error('Error requesting bulk vaulting:', error)
      Alert.alert('Error', 'Failed to create vaulting request')
    }
  }

  // Update user avatar
  // IMPORTANT: imageUri MUST be a Cloudinary URL (https://), never a local file path
  const updateUserAvatar = async (imageUri: string) => {
    try {
      // Safety check: Ensure we never save local file paths to the database
      if (!isExternalUrl(imageUri)) {
        console.error('Attempted to save local file path as avatar:', imageUri)
        Alert.alert('Error', 'Avatar must be uploaded to Cloudinary first')
        return
      }

      // Check session
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        Alert.alert('Error', 'Please log in')
        return
      }

      // Get session token
      const sessionToken = session.data.session.token

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`, // Send session token for mobile
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          avatar: imageUri, // This should always be a Cloudinary URL at this point
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh user data
        await fetchUserProfile()
        Alert.alert('Success', 'Avatar updated successfully!')
      } else {
        Alert.alert('Error', data.message || 'Failed to update avatar')
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error)
      Alert.alert('Error', 'Failed to update avatar')
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchUserProfile()
    fetchCollections()
  }, [])

  // Refresh data when screen comes into focus (e.g., after returning from payment)
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile()
      fetchCollections()
    }, [])
  )

  // Transform collections to products format
  const products = collections.map((collection) => {
    const price = collection.estimatedValue || collection.purchasePrice || '0'
    const priceStr = `$${parseFloat(price).toFixed(2)}`
    
    return {
      id: collection.id,
      name: collection.name,
      price: priceStr,
      image: collection.image ? { uri: collection.image } : require('../../assets/singles/Shining_Charizard_Secret.jpg'),
      isListed: collection.isListed || false, // Pass through the isListed flag
    }
  })

  // Get user display name
  const userName = user?.firstName || user?.name || 'User'
  const userLevel = user?.level || 0 // Start at 0 for new users
  const currentXP = user?.currentXP || 0
  const xpToNextLevel = user?.xpToNextLevel || 100
  const isPremium = user?.isPremium || false
  const portfolioValueStr = portfolioValue > 0 
    ? `R${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'R0'

  // Default goal - can be made user-configurable later
  const defaultGoal = 200

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
        <Text style={[styles.emptyText, { marginTop: SPACING.md }]}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          userName={userName}
          isPremium={isPremium}
          portfolioValue={portfolioValueStr}
          stats={stats}
          portfolioData={portfolioData}
          level={userLevel}
          currentXP={currentXP}
          xpToNextLevel={xpToNextLevel}
          profileImage={user?.avatar ? { uri: user.avatar } : require('../../assets/Avatars/guy1.jpg')}
          productsCount={user?.productsCount || 0}
          followersCount={user?.followersCount || 0}
          salesCount={user?.salesCount || 0}
          onEditPress={async () => {
            // Update avatar
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Photo library access is required.')
              return
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
              aspect: [1, 1], // Square for avatar
            })
            if (!result.canceled && result.assets[0]) {
              try {
                // Upload image to Cloudinary first
                const imageUrl = await uploadImage(result.assets[0].uri, 'gradeit/avatars')
                // Then update user avatar with the Cloudinary URL
                updateUserAvatar(imageUrl)
              } catch (error: any) {
                Alert.alert('Upload Error', error.message || 'Failed to upload avatar image')
              }
            }
          }}
        />

        <View style={styles.contentWrapper}>
          {/* Section Header with Add Card Button */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Products</Text>
            <View style={styles.sectionHeaderActions}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddCardModalVisible(true)}
              >
                <Ionicons name="add" size={18} color={theme.tintColor || '#73EC8B'} />
                <Text style={styles.addButtonText}>Add Card</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.vaultButton}
                onPress={() => setIsBulkVaultingModalVisible(true)}
              >
                <Ionicons name="lock-closed-outline" size={18} color={theme.tintColor || '#73EC8B'} />
                <Text style={styles.vaultButtonText}>Vault</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Coming Soon', 'Full products view coming soon!')
                }}
                activeOpacity={0.6}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Section 
            title=""
            showSeeAll={false}
            style={styles.firstSection}
          >
            {/* Stats Grid */}
            <View style={styles.statsPillContainer}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.cards}</Text>
                  <Text style={styles.statLabel}>Cards</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.sealed}</Text>
                  <Text style={styles.statLabel}>Sealed</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.slabs}</Text>
                  <Text style={styles.statLabel}>Slabs</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </View>
            
            {products.length > 0 ? (
              <ProductGrid
                products={products}
                onProductPress={(product) => {
                  if (product.image) {
                    const price = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0
                    navigation.navigate('Product', {
                      name: product.name,
                      image: product.image,
                      category: 'product',
                      price: price,
                      description: `Premium ${product.name}. Authentic and verified with secure shipping.`,
                    })
                  }
                }}
                onQuickListPress={(product) => {
                  // Only allow listing if not already listed
                  if (!product.isListed) {
                    setSelectedProduct({ 
                      id: product.id as number,
                      name: product.name, 
                      image: product.image 
                    })
                    setIsListItemModalVisible(true)
                  }
                }}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyText}>No products in your collection yet</Text>
                <Text style={[styles.emptyText, { fontSize: TYPOGRAPHY.caption, marginTop: SPACING.xs }]}>
                  Add items to your collection to list them for sale
                </Text>
              </View>
            )}
          </Section>

          <Section title="Collection Goal">
            <GoalProgress
              current={stats.total}
              goal={defaultGoal}
              label="Total Cards"
            />
          </Section>

          <Section title="Set Distribution">
            {setDistribution.length > 0 ? (
              <SetChart
                data={setDistribution}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="pie-chart-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyText}>No set data available yet</Text>
                <Text style={[styles.emptyText, { fontSize: TYPOGRAPHY.caption, marginTop: SPACING.xs }]}>
                  Add items to your collection to see set distribution
                </Text>
              </View>
            )}
          </Section>
        </View>
      </ScrollView>

      {/* List Item Modal */}
      {selectedProduct && (
        <ListItemModal
          visible={isListItemModalVisible}
          productName={selectedProduct.name}
          productImage={selectedProduct.image}
          onClose={() => {
            setIsListItemModalVisible(false)
            setSelectedProduct(null)
          }}
          onList={async (price) => {
            await createListing(selectedProduct.name, price, selectedProduct.image)
            setIsListItemModalVisible(false)
            setSelectedProduct(null)
          }}
        />
      )}

      {/* Add Card Modal */}
      <AddCardModal
        visible={isAddCardModalVisible}
        onClose={() => setIsAddCardModalVisible(false)}
        onAdd={async (data) => {
          await addCardToCollection(data)
          // Modal will close itself on success
        }}
      />

      {/* Bulk Vaulting Modal */}
      <BulkVaultingModal
        visible={isBulkVaultingModalVisible}
        collections={collections.map(c => ({
          id: c.id,
          name: c.name,
          image: c.image || undefined,
          set: c.set || undefined,
          type: c.type,
        }))}
        onClose={() => setIsBulkVaultingModalVisible(false)}
        onRequestVaulting={requestBulkVaulting}
      />
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContentContainer: {
    paddingBottom: SPACING['4xl'],
  },
  contentWrapper: {
    backgroundColor: theme.backgroundColor,
    paddingHorizontal: SPACING.containerPadding,
  },
  firstSection: {
    marginTop: SPACING.md,
  },
  placeholderContainer: {
    padding: SPACING['2xl'],
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  ordersContainer: {
    width: '100%',
  },
  statsPillContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: 4,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statSeparator: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    padding: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    fontWeight: '600',
    color: theme.textColor,
    letterSpacing: -0.3,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(115, 236, 139, 0.1)',
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  vaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(115, 236, 139, 0.1)',
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
  },
  vaultButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.1,
  },
})
