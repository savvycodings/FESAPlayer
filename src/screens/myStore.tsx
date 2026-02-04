import { useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../components/ui/text'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Card, CardContent } from '../components/ui/card'
import { AuctionSection, CreateAuctionModal, type Auction, OrderCard, type Order, ListItemModal, AddISOModal } from '../components/profile'
import { Section } from '../components/layout/Section'
import {
  StoreHeader,
  StoreStats,
  StoreListings,
  SafetyFilter,
  ShareLinkButton,
} from '../components/store'
import { type StoreListing } from '../components/store/StoreListings'
import { DOMAIN } from '../../constants'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage, isExternalUrl } from '../utils/imageUpload'
import { authClient } from '../lib/auth-client'

type MyStoreStackParamList = {
  MyStoreMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
  }
}

type MyStoreScreenNavigationProp = NativeStackNavigationProp<MyStoreStackParamList, 'MyStoreMain'>

// Helper function to calculate time remaining
function calculateTimeRemaining(startTime: Date | string): string {
  const now = new Date()
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const diff = start.getTime() - now.getTime()
  
  if (diff <= 0) return 'Starting now'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `Starts in ${minutes}m`
  } else {
    return 'Starting now'
  }
}

export function MyStore() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<MyStoreScreenNavigationProp>()
  const styles = getStyles(theme)
  const [activeTab, setActiveTab] = useState('MY STORE')
  const [vaultedOnly, setVaultedOnly] = useState(false)
  const [isListItemModalVisible, setIsListItemModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; image?: any } | null>(null)
  const [isCreateAuctionModalVisible, setIsCreateAuctionModalVisible] = useState(false)
  const [editingListing, setEditingListing] = useState<StoreListing | null>(null)
  const [isAddISOModalVisible, setIsAddISOModalVisible] = useState(false)

  // Store state
  const [store, setStore] = useState<any>(null)
  const [storeLoading, setStoreLoading] = useState(true)
  const [listings, setListings] = useState<StoreListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [auctionsLoading, setAuctionsLoading] = useState(false)
  const [isoItems, setIsoItems] = useState<any[]>([])
  const [isoLoading, setIsoLoading] = useState(false)

  // Store creation modal
  const [isCreateStoreModalVisible, setIsCreateStoreModalVisible] = useState(false)
  const [newStoreName, setNewStoreName] = useState('')
  const [creatingStore, setCreatingStore] = useState(false)

  // Get Better Auth session token for API calls
  const getSessionToken = async () => {
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        return null
      }
      return session.data.session.token
    } catch (error) {
      console.error('Error getting session token:', error)
      return null
    }
  }

  // Fetch store data
  const fetchStore = async () => {
    try {
      setStoreLoading(true)
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in to access your store')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
      })

      const data = await response.json()

      if (response.ok) {
        if (data.store) {
          setStore(data.store)
        } else {
          // Store doesn't exist - show creation modal
          setIsCreateStoreModalVisible(true)
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch store')
      }
    } catch (error: any) {
      console.error('Error fetching store:', error)
      Alert.alert('Error', 'Failed to load store data')
    } finally {
      setStoreLoading(false)
    }
  }

  // Create store
  const createStore = async () => {
    try {
      setCreatingStore(true)
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          storeName: newStoreName || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStore(data.store)
        setIsCreateStoreModalVisible(false)
        setNewStoreName('')
        Alert.alert('Success', 'Store created successfully!')
      } else {
        Alert.alert('Error', data.message || 'Failed to create store')
      }
    } catch (error: any) {
      console.error('Error creating store:', error)
      Alert.alert('Error', 'Failed to create store')
    } finally {
      setCreatingStore(false)
    }
  }

  // Fetch listings
  const fetchListings = async () => {
    if (!store) return
    try {
      setListingsLoading(true)
      const token = await getSessionToken()
      if (!token) return

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/listings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
      })

      const data = await response.json()

      if (response.ok) {
        // Transform database listings to component format
        const transformedListings: StoreListing[] = data.listings.map((listing: any) => ({
          id: listing.id.toString(),
          cardName: listing.cardName,
          cardImage: listing.cardImage ? { uri: listing.cardImage } : require('../../assets/singles/Shining_Charizard_Secret.jpg'),
          price: parseFloat(listing.price || '0'),
          vaultingStatus: listing.vaultingStatus || 'seller-has',
          purchaseType: listing.purchaseType || 'both',
          currentBid: listing.currentBid ? parseFloat(listing.currentBid) : undefined,
          bidCount: listing.bidCount || 0,
        }))
        setListings(transformedListings)
      }
    } catch (error: any) {
      console.error('Error fetching listings:', error)
    } finally {
      setListingsLoading(false)
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    if (!store) return
    try {
      setOrdersLoading(true)
      const token = await getSessionToken()
      if (!token) return

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
      })

      const data = await response.json()

      if (response.ok) {
        const transformedOrders: Order[] = data.orders.map((order: any) => ({
          id: order.id.toString(),
          itemName: order.itemName,
          itemImage: order.itemImage ? { uri: order.itemImage } : require('../../assets/singles/Shining_Charizard_Secret.jpg'),
          price: parseFloat(order.price || '0'),
          quantity: order.quantity || 1,
          orderDate: new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: order.status || 'processing',
          orderNumber: order.orderNumber,
        }))
        setOrders(transformedOrders)
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Fetch auctions
  const fetchAuctions = async () => {
    if (!store) return
    try {
      setAuctionsLoading(true)
      const token = await getSessionToken()
      if (!token) return

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/auctions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
      })

      const data = await response.json()

      if (response.ok) {
        const transformedAuctions: Auction[] = data.auctions.map((auction: any) => ({
          id: auction.id.toString(),
          title: auction.title,
          description: auction.description || '',
          startTime: new Date(auction.startTime),
          status: auction.status || 'starting',
          timeRemaining: calculateTimeRemaining(auction.startTime),
          currentBid: auction.currentBid ? parseFloat(auction.currentBid) : undefined,
          bidCount: auction.bidCount || 0,
        }))
        setAuctions(transformedAuctions)
      }
    } catch (error: any) {
      console.error('Error fetching auctions:', error)
    } finally {
      setAuctionsLoading(false)
    }
  }

  // Fetch ISO items
  const fetchISOItems = async () => {
    if (!store) return
    try {
      setIsoLoading(true)
      const token = await getSessionToken()
      if (!token) return

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/iso`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
      })

      const data = await response.json()

      if (response.ok) {
        setIsoItems(data.isoItems || [])
      }
    } catch (error: any) {
      console.error('Error fetching ISO items:', error)
    } finally {
      setIsoLoading(false)
    }
  }

  // Create listing
  const createListing = async (cardName: string, price: number, cardImage?: any) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      // Upload image if it's a local URI (not already an external URL)
      let imageUrl: string | null = null
      const imageUri = cardImage?.uri || (typeof cardImage === 'string' ? cardImage : null)
      
      if (imageUri) {
        if (isExternalUrl(imageUri)) {
          imageUrl = imageUri
        } else {
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
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
        // Wait for listings to refresh before showing success
        await fetchListings()
        // Don't show alert here - let the modal handle closing
        // The listing will now be visible in the list
      } else {
        Alert.alert('Error', data.message || 'Failed to create listing')
      }
    } catch (error: any) {
      console.error('Error creating listing:', error)
      Alert.alert('Error', 'Failed to create listing')
    }
  }

  // Update listing
  const updateListing = async (listingId: string, updates: Partial<StoreListing>) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          price: updates.price,
          cardName: updates.cardName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Wait for listings to refresh before returning
        await fetchListings()
        // Success - listings will be updated
      } else {
        Alert.alert('Error', data.message || 'Failed to update listing')
        throw new Error(data.message || 'Failed to update listing')
      }
    } catch (error: any) {
      console.error('Error updating listing:', error)
      Alert.alert('Error', 'Failed to update listing')
    }
  }

  // Create auction
  const createAuction = async (auctionData: { title: string; description: string; startTime: Date }) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/auctions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          title: auctionData.title,
          description: auctionData.description,
          startTime: auctionData.startTime.toISOString(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchAuctions()
        Alert.alert('Success', 'Auction created successfully!')
      } else {
        Alert.alert('Error', data.message || 'Failed to create auction')
      }
    } catch (error: any) {
      console.error('Error creating auction:', error)
      Alert.alert('Error', 'Failed to create auction')
    }
  }

  // Create ISO item
  const createISOItem = async (cardName: string, cardNumber?: string, set?: string) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/iso`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          cardName,
          cardNumber: cardNumber || null,
          set: set || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchISOItems()
        Alert.alert('Success', 'ISO item added successfully!')
      } else {
        Alert.alert('Error', data.message || 'Failed to add ISO item')
      }
    } catch (error: any) {
      console.error('Error creating ISO item:', error)
      Alert.alert('Error', 'Failed to add ISO item')
    }
  }

  // Update store banner
  const updateStoreBanner = async (imageUri: string) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          bannerUrl: imageUri,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchStore()
        Alert.alert('Success', 'Banner updated successfully!')
      } else {
        Alert.alert('Error', data.message || 'Failed to update banner')
      }
    } catch (error: any) {
      console.error('Error updating banner:', error)
      Alert.alert('Error', 'Failed to update banner')
    }
  }

  // Update user avatar (shared across profile and store)
  const updateUserAvatar = async (imageUri: string) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify({
          avatar: imageUri,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh store to get updated user data
        await fetchStore()
        Alert.alert('Success', 'Avatar updated successfully!')
      } else {
        Alert.alert('Error', data.message || 'Failed to update avatar')
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error)
      Alert.alert('Error', 'Failed to update avatar')
    }
  }

  // Load store on mount
  useEffect(() => {
    fetchStore()
  }, [])

  // Load data when store is available and tab changes
  useEffect(() => {
    if (store) {
      if (activeTab === 'MY STORE') {
        fetchListings()
      } else if (activeTab === 'ORDERS') {
        fetchOrders()
      } else if (activeTab === 'AUCTIONS') {
        fetchAuctions()
      } else if (activeTab === 'ISO') {
        fetchISOItems()
      }
    }
  }, [store, activeTab])

  // Refresh listings when screen comes into focus (Option 5: Combined approach)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if store exists and we're on the MY STORE tab
      if (store && activeTab === 'MY STORE') {
        fetchListings()
      }
    }, [store, activeTab])
  )

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      if (vaultedOnly) {
        return listing.vaultingStatus === 'vaulted'
      }
      return true
    })
  }, [listings, vaultedOnly])

  const getOngoingOrders = (): Order[] => {
    return orders.filter(order => 
      order.status === 'processing' || order.status === 'shipped'
    )
  }

  const getCompletedOrders = (): Order[] => {
    return orders.filter(order => order.status === 'completed')
  }

  const tabs = ['AUCTIONS', 'MY STORE', 'ISO', 'ORDERS']

  // Get user info from Better Auth for default values
  const [userInfo, setUserInfo] = useState<any>(null)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          setUserInfo(session.data.user)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    fetchUser()
  }, [])

  // Show loading or store creation modal
  if (storeLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
        <Text style={[styles.emptyText, { marginTop: SPACING.md }]}>Loading store...</Text>
      </View>
    )
  }

  if (!store) {
    return (
      <View style={styles.container}>
        <Modal
          visible={isCreateStoreModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <CardContent style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create Your Store</Text>
                <Text style={styles.modalSubtitle}>
                  Get started by creating your own card shop!
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Store name (optional)"
                  placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                  value={newStoreName}
                  onChangeText={setNewStoreName}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => setIsCreateStoreModalVisible(false)}
                    disabled={creatingStore}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={createStore}
                    disabled={creatingStore}
                  >
                    {creatingStore ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Create Store</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          </View>
        </Modal>
      </View>
    )
  }

  // Get store display values
  const storeName = store.storeName || `${store.user?.firstName || store.user?.name || 'User'}'s Card Shop`
  const userLevel = store.user?.level || 1
  const currentXP = store.user?.currentXP || 0
  const xpToNextLevel = store.user?.xpToNextLevel || 100
  const salesCount = store.totalSales || 0
  const totalRevenue = 0 // TODO: Calculate from orders
  const shareableLink = `saplayer.app/store/${store.id}`

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contentWrapper}>
          {activeTab === 'AUCTIONS' && (
            <Section title="Auctions">
              {auctionsLoading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
                </View>
              ) : (
                <AuctionSection
                  auctions={auctions}
                  onCreateAuction={() => setIsCreateAuctionModalVisible(true)}
                  onAuctionPress={(auction) => {
                    console.log('Auction pressed:', auction.id)
                  }}
                  showCreateButton={true}
                />
              )}
            </Section>
          )}

          {activeTab === 'ISO' && (
            <Section title="In Search Of" showSeeAll={false}>
              <Card style={styles.isoCard}>
                <CardContent style={styles.isoCardContent}>
                  <TouchableOpacity
                    style={styles.addISOButton}
                    onPress={() => setIsAddISOModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={theme.tintColor || '#73EC8B'} />
                    <Text style={styles.addISOText}>Add Card to ISO</Text>
                  </TouchableOpacity>
                  {isoLoading ? (
                    <View style={styles.emptyContainer}>
                      <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                    </View>
                  ) : isoItems.length > 0 ? (
                    <>
                      <View style={styles.isoSeparator} />
                      {isoItems.map((isoItem, index) => (
                        <View key={isoItem.id}>
                          <View style={styles.isoItem}>
                            <View style={styles.isoItemLeft}>
                              <View style={styles.isoDetailRow}>
                                <Text style={styles.isoDetailLabel}>Card Name:</Text>
                                <Text style={styles.isoDetailValue}>{isoItem.cardName}</Text>
                              </View>
                              {isoItem.cardNumber && (
                                <View style={styles.isoDetailRow}>
                                  <Text style={styles.isoDetailLabel}>Card Number:</Text>
                                  <Text style={styles.isoDetailValue}>{isoItem.cardNumber}</Text>
                                </View>
                              )}
                              {isoItem.set && (
                                <View style={styles.isoDetailRow}>
                                  <Text style={styles.isoDetailLabel}>Set:</Text>
                                  <Text style={styles.isoDetailValue}>{isoItem.set}</Text>
                                </View>
                              )}
                            </View>
                            {isoItem.image && (
                              <View style={styles.isoItemRight}>
                                <Image
                                  source={{ uri: isoItem.image }}
                                  style={styles.isoCardImage}
                                  resizeMode="contain"
                                />
                              </View>
                            )}
                          </View>
                          {index < isoItems.length - 1 && <View style={styles.isoSeparator} />}
                        </View>
                      ))}
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No ISO items yet</Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            </Section>
          )}

          {activeTab === 'MY STORE' && (
            <>
              <StoreHeader
                storeName={storeName}
                bannerUrl={store.bannerUrl ? { uri: store.bannerUrl } : require('../../assets/banners/banner2.jpg')}
                profileImage={store.user?.avatar ? { uri: store.user.avatar } : require('../../assets/Avatars/guy1.jpg')}
                profileInitials={store.user?.firstName?.[0] || store.user?.name?.[0] || 'U'}
                level={userLevel}
                currentXP={currentXP}
                xpToNextLevel={xpToNextLevel}
                salesCount={salesCount}
                shareableLink={shareableLink}
                showBannerEdit={true}
                onBannerEditPress={async () => {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
                  if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Photo library access is required.')
                    return
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    quality: 0.8,
                  })
                  if (!result.canceled && result.assets[0]) {
                    try {
                      // Upload image to Cloudinary first
                      const imageUrl = await uploadImage(result.assets[0].uri, 'gradeit/banners')
                      // Then update store with the Cloudinary URL
                      updateStoreBanner(imageUrl)
                    } catch (error: any) {
                      Alert.alert('Upload Error', error.message || 'Failed to upload banner image')
                    }
                  }
                }}
                onEditPress={async () => {
                  // Update avatar (shared with profile)
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

              <StoreStats
                totalSales={store.totalSales || 0}
                totalRevenue={totalRevenue}
                responseTime="2h"
                reviewPercentage={store.rating ? Math.round(parseFloat(store.rating) * 20) : 98}
              />

              <SafetyFilter
                enabled={vaultedOnly}
                onToggle={setVaultedOnly}
              />

              <View style={styles.shareLinkContainer}>
                <ShareLinkButton storeLink={shareableLink} />
              </View>

              <Section title="My Listings">
                {listingsLoading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
                  </View>
                ) : (
                  <StoreListings
                    listings={filteredListings}
                    isOwnListing={true}
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
                    onEditPress={(listing: StoreListing) => {
                      setEditingListing(listing)
                      setSelectedProduct({ 
                        name: listing.cardName, 
                        image: listing.cardImage || null 
                      })
                      setIsListItemModalVisible(true)
                    }}
                    onBuyPress={() => {}}
                    onBidPress={() => {}}
                  />
                )}
              </Section>
            </>
          )}

          {activeTab === 'ORDERS' && (
            <>
              <Section title="Ongoing Orders">
                {ordersLoading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
                  </View>
                ) : getOngoingOrders().length > 0 ? (
                  <View style={styles.ordersContainer}>
                    {getOngoingOrders().map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onPress={() => {
                          console.log('Order pressed:', order.id)
                        }}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={styles.emptyText}>No ongoing orders</Text>
                  </View>
                )}
              </Section>

              <Section title="Completed Orders">
                {ordersLoading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
                  </View>
                ) : getCompletedOrders().length > 0 ? (
                  <View style={styles.ordersContainer}>
                    {getCompletedOrders().map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onPress={() => {
                          console.log('Order pressed:', order.id)
                        }}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={styles.emptyText}>No completed orders</Text>
                  </View>
                )}
              </Section>
            </>
          )}
        </View>
      </ScrollView>

      {/* List Item Modal */}
      {selectedProduct && (
        <ListItemModal
          visible={isListItemModalVisible}
          productName={selectedProduct.name}
          productImage={selectedProduct.image}
          initialPrice={editingListing?.price}
          initialDescription={editingListing ? `Premium ${editingListing.cardName}. Authentic and verified with secure shipping.` : undefined}
          onClose={() => {
            setIsListItemModalVisible(false)
            setSelectedProduct(null)
            setEditingListing(null)
          }}
          onList={async (price) => {
            if (editingListing) {
              await updateListing(editingListing.id, { price })
            } else {
              await createListing(selectedProduct.name, price, selectedProduct.image)
            }
            setIsListItemModalVisible(false)
            setSelectedProduct(null)
            setEditingListing(null)
          }}
        />
      )}

      {/* Create Auction Modal */}
      <CreateAuctionModal
        visible={isCreateAuctionModalVisible}
        onClose={() => setIsCreateAuctionModalVisible(false)}
        onCreateAuction={async (data) => {
          await createAuction(data)
          setIsCreateAuctionModalVisible(false)
        }}
      />

      {/* Add ISO Modal */}
      <AddISOModal
        visible={isAddISOModalVisible}
        onClose={() => setIsAddISOModalVisible(false)}
        onAdd={async (cardName, cardNumber, set) => {
          await createISOItem(cardName, cardNumber, set)
          setIsAddISOModalVisible(false)
        }}
      />
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING['4xl'],
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundColor,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING['2xl'],
    borderWidth: 1,
    borderColor: theme.textColor,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    borderRadius: RADIUS.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.textColor,
  },
  tabText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: theme.backgroundColor,
  },
  contentWrapper: {
    width: '100%',
  },
  ordersContainer: {
    gap: SPACING.md,
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
  shareLinkContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  addISOButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
    gap: SPACING.xs,
  },
  addISOText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: theme.cardBackground || '#1a1a1a',
    borderRadius: RADIUS.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  modalContent: {
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: theme.backgroundColor || '#000',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    color: theme.textColor,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    marginBottom: SPACING.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: theme.tintColor || '#73EC8B',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  modalButtonTextPrimary: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: '#000',
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
})
