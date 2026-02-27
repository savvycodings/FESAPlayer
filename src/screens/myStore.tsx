import { useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../components/ui/text'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Card, CardContent } from '../components/ui/card'
import { AuctionSection, CreateAuctionModal, type Auction, OrderCard, type Order, ListItemModal, AddISOModal } from '../components/profile'
import { Section } from '../components/layout/Section'
import { SkeletonBox } from '../components/layout/SkeletonBox'
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
import { getPokemonTcgImageUrlFromSetNumberIfOnCdn } from '../utils/pokemonTcgImages'

type MyStoreStackParamList = {
  MyStoreMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
    storeName?: string
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
  const [refreshing, setRefreshing] = useState(false)
  const [listings, setListings] = useState<StoreListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [listingsHasLoadedOnce, setListingsHasLoadedOnce] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersHasLoadedOnce, setOrdersHasLoadedOnce] = useState(false)
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [auctionsLoading, setAuctionsLoading] = useState(false)
  const [auctionsHasLoadedOnce, setAuctionsHasLoadedOnce] = useState(false)
  const [isoItems, setIsoItems] = useState<any[]>([])
  const [isoLoading, setIsoLoading] = useState(false)
  const [isoHasLoadedOnce, setIsoHasLoadedOnce] = useState(false)

  // Store creation modal
  const [isCreateStoreModalVisible, setIsCreateStoreModalVisible] = useState(false)
  const [newStoreName, setNewStoreName] = useState('')
  const [newTwitchUrl, setNewTwitchUrl] = useState('')
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('')
  const [creatingStore, setCreatingStore] = useState(false)

  // Edit store details modal (store name + optional Twitch/YouTube URLs)
  const [isEditStoreModalVisible, setIsEditStoreModalVisible] = useState(false)
  const [editStoreName, setEditStoreName] = useState('')
  const [editTwitchUrl, setEditTwitchUrl] = useState('')
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('')
  const [updatingStore, setUpdatingStore] = useState(false)

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
  const fetchStore = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    try {
      if (!silent) setStoreLoading(true)
      const token = await getSessionToken()
      if (!token) {
        if (!silent) setStoreLoading(false)
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
      if (!silent) setStoreLoading(false)
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
          twitchUrl: newTwitchUrl.trim() || undefined,
          youtubeUrl: newYoutubeUrl.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStore(data.store)
        setIsCreateStoreModalVisible(false)
        setNewStoreName('')
        setNewTwitchUrl('')
        setNewYoutubeUrl('')
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

  const openEditStoreModal = () => {
    if (!store) return
    setEditStoreName(store.storeName || '')
    setEditTwitchUrl(store.twitchUrl || '')
    setEditYoutubeUrl(store.youtubeUrl || '')
    setIsEditStoreModalVisible(true)
  }

  const updateStoreDetails = async () => {
    try {
      setUpdatingStore(true)
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
        credentials: 'include',
        body: JSON.stringify({
          storeName: editStoreName.trim() || undefined,
          twitchUrl: editTwitchUrl.trim() === '' ? null : editTwitchUrl.trim() || undefined,
          youtubeUrl: editYoutubeUrl.trim() === '' ? null : editYoutubeUrl.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        await fetchStore({ silent: true })
        setIsEditStoreModalVisible(false)
        Alert.alert('Success', 'Store details updated.')
      } else {
        Alert.alert('Error', data.message || 'Failed to update store')
      }
    } catch (error: any) {
      console.error('Error updating store:', error)
      Alert.alert('Error', 'Failed to update store')
    } finally {
      setUpdatingStore(false)
    }
  }

  // Fetch listings
  const fetchListings = async () => {
    if (!store) return
    try {
      setListingsLoading(true)
      const token = await getSessionToken()
      if (!token) {
        setListingsLoading(false)
        return
      }

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
        // Transform database listings to component format (default to [] if missing)
        const raw = data.listings || []
        const transformedListings: StoreListing[] = raw.map((listing: any) => ({
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
      } else {
        setListings([])
      }
    } catch (error: any) {
      console.error('Error fetching listings:', error)
      setListings([])
    } finally {
      setListingsLoading(false)
      setListingsHasLoadedOnce(true)
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    if (!store) return
    try {
      setOrdersLoading(true)
      const token = await getSessionToken()
      if (!token) {
        setOrdersLoading(false)
        return
      }

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
        const transformedOrders: Order[] = (data.orders || []).map((order: any) => ({
          id: order.id.toString(),
          itemName: order.itemName,
          itemImage: order.itemImage ? { uri: order.itemImage } : require('../../assets/singles/Shining_Charizard_Secret.jpg'),
          price: parseFloat(order.price || '0'),
          quantity: order.quantity || 1,
          orderDate: new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: order.status || 'processing',
          orderNumber: order.orderNumber,
          shippingFeeZar: order.shippingFeeZar != null ? parseFloat(order.shippingFeeZar) : undefined,
          trackingStatus: order.trackingStatus || undefined,
        }))
        setOrders(transformedOrders)
      } else {
        setOrders([])
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setOrdersLoading(false)
      setOrdersHasLoadedOnce(true)
    }
  }

  // Fetch auctions
  const fetchAuctions = async () => {
    if (!store) return
    try {
      setAuctionsLoading(true)
      const token = await getSessionToken()
      if (!token) {
        setAuctionsLoading(false)
        return
      }

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
        const transformedAuctions: Auction[] = (data.auctions || []).map((auction: any) => ({
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
      } else {
        setAuctions([])
      }
    } catch (error: any) {
      console.error('Error fetching auctions:', error)
      setAuctions([])
    } finally {
      setAuctionsLoading(false)
      setAuctionsHasLoadedOnce(true)
    }
  }

  // Fetch ISO items
  const fetchISOItems = async () => {
    if (!store) return
    try {
      setIsoLoading(true)
      const token = await getSessionToken()
      if (!token) {
        setIsoLoading(false)
        return
      }

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
      } else {
        setIsoItems([])
      }
    } catch (error: any) {
      console.error('Error fetching ISO items:', error)
      setIsoItems([])
    } finally {
      setIsoLoading(false)
      setIsoHasLoadedOnce(true)
    }
  }

  // Create listing (optionally with 3 photos: front, back, up close)
  const createListing = async (cardName: string, price: number, cardImage?: any, listingPhotos?: { front: string; back: string; close: string }) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }

      let imageUrl: string | null = null
      let imageBackUrl: string | undefined
      let imageCloseUrl: string | undefined

      const uploadOne = async (uri: string): Promise<string> => {
        if (isExternalUrl(uri)) return uri
        return uploadImage(uri, 'gradeit/listings')
      }

      if (listingPhotos) {
        try {
          const [front, back, close] = await Promise.all([
            uploadOne(listingPhotos.front),
            uploadOne(listingPhotos.back),
            uploadOne(listingPhotos.close),
          ])
          imageUrl = front
          imageBackUrl = back
          imageCloseUrl = close
        } catch (error: any) {
          Alert.alert('Upload Error', error.message || 'Failed to upload listing photos')
          return
        }
      } else {
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
      }

      if (!imageUrl) {
        Alert.alert('Photo required', 'Please add all 3 photos to list your card.')
        return
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/listings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cardName,
          price,
          cardImage: imageUrl,
          ...(imageBackUrl && { cardImageBack: imageBackUrl }),
          ...(imageCloseUrl && { cardImageClose: imageCloseUrl }),
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

  // Remove listing from store (your store only)
  const removeListing = async (listingId: string) => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        throw new Error('Please log in')
      }

      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        // Optimistically remove from list so the item disappears immediately
        setListings((prev) => prev.filter((l) => String(l.id) !== String(listingId)))
        await fetchListings()
        // Close modal and clear editing state (caller may also close; harmless)
        setIsListItemModalVisible(false)
        setSelectedProduct(null)
        setEditingListing(null)
        Alert.alert('Done', 'Listing removed from your store.')
      } else {
        const msg = data.message || 'Failed to remove listing'
        Alert.alert('Error', msg)
        throw new Error(msg)
      }
    } catch (error: any) {
      console.error('Error removing listing:', error)
      if (error?.message !== 'Please log in') {
        Alert.alert('Error', 'Failed to remove listing')
      }
      throw error
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

  // Load store when screen is focused (silent refresh when store already loaded)
  useFocusEffect(
    useCallback(() => {
      if (store) {
        fetchStore({ silent: true })
      } else {
        fetchStore()
      }
    }, [store])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchStore({ silent: true })
    if (store) {
      if (activeTab === 'MY STORE') await fetchListings()
      else if (activeTab === 'ORDERS') await fetchOrders()
      else if (activeTab === 'AUCTIONS') await fetchAuctions()
      else if (activeTab === 'ISO') await fetchISOItems()
    }
    setRefreshing(false)
  }, [store, activeTab])

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

  const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 16
  const formatIsoPrice = (usd: number) => `R${Math.round(usd * USD_TO_ZAR).toLocaleString('en-ZA')}`

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

  // No store yet and not loading – show Create Store modal
  if (!store && !storeLoading) {
    return (
      <View style={styles.container}>
        <Modal
          visible={true}
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
                  placeholder="Store name (required)"
                  placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                  value={newStoreName}
                  onChangeText={setNewStoreName}
                />
                <View style={styles.modalInputRow}>
                  <View style={styles.modalInputIcon}>
                    <Ionicons name="logo-twitch" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'} />
                  </View>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputInRow]}
                    placeholder="Twitch URL (optional)"
                    placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                    value={newTwitchUrl}
                    onChangeText={setNewTwitchUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
                <View style={styles.modalInputRow}>
                  <View style={styles.modalInputIcon}>
                    <Ionicons name="logo-youtube" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'} />
                  </View>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputInRow]}
                    placeholder="YouTube URL (optional)"
                    placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                    value={newYoutubeUrl}
                    onChangeText={setNewYoutubeUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => setIsCreateStoreModalVisible(false)}
                    disabled={creatingStore}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary, !newStoreName.trim() && styles.modalButtonDisabled]}
                    onPress={createStore}
                    disabled={creatingStore || !newStoreName.trim()}
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

  // Get store display values (when store is set)
  const storeName = store?.storeName || (store ? `${store.user?.firstName || store.user?.name || 'User'}'s Card Shop` : '')
  const userLevel = store?.user?.level || 1
  const currentXP = store?.user?.currentXP || 0
  const xpToNextLevel = store?.user?.xpToNextLevel || 100
  const salesCount = store?.totalSales || 0
  const totalRevenue = 0 // TODO: Calculate from orders
  const shareableLink = store ? `saplayer.app/store/${store.id}` : ''

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.tintColor || '#73EC8B'}
          />
        }
      >
        {storeLoading && !store ? (
          <>
            <View style={styles.skeletonHeader}>
              <SkeletonBox width="100%" height={120} borderRadius={0} />
              <View style={styles.skeletonHeaderRow}>
                <SkeletonBox width={56} height={56} borderRadius={28} style={{ marginRight: SPACING.md }} />
                <View style={styles.skeletonHeaderText}>
                  <SkeletonBox width={140} height={18} borderRadius={4} style={{ marginBottom: SPACING.sm }} />
                  <SkeletonBox width={80} height={12} borderRadius={4} />
                </View>
              </View>
            </View>
            <View style={styles.tabsRow}>
              {tabs.map((tab) => (
                <TouchableOpacity key={tab} style={styles.tabPill} activeOpacity={0.7}>
                  <Text style={styles.tabPillText} numberOfLines={1}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.contentWrapper}>
              <View style={styles.skeletonLoadingLabel}>
                <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                <Text style={styles.skeletonLoadingText}>Loading your store…</Text>
              </View>
              <SkeletonBox width="100%" height={64} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.lg }} />
              <View style={styles.skeletonListingsRow}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonListingCard}>
                    <SkeletonBox width="100%" height={100} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
                    <SkeletonBox width={60} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width="70%" height={12} borderRadius={4} />
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : store ? (
          <>
        {/* Banner first (Destined Rivals–style layout) */}
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
          onEditStorePress={openEditStoreModal}
          twitchUrl={store.twitchUrl ?? undefined}
          youtubeUrl={store.youtubeUrl ?? undefined}
        />

        {/* Tab bar below banner – full width, evenly spaced */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabPill,
                activeTab === tab && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabPillText,
                  activeTab === tab && styles.tabPillTextActive,
                ]}
                numberOfLines={1}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contentWrapper}>
          {activeTab === 'AUCTIONS' && (
            <Section title="Auctions">
              {auctionsLoading && !auctionsHasLoadedOnce ? (
                <>
                  <View style={styles.skeletonLoadingLabel}>
                    <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                    <Text style={styles.skeletonLoadingText}>Loading auctions…</Text>
                  </View>
                  <View style={styles.skeletonAuctionList}>
                    {[1, 2].map((i) => (
                      <SkeletonBox key={i} width="100%" height={72} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
                    ))}
                  </View>
                </>
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
                  {isoLoading && !isoHasLoadedOnce ? (
                    <>
                      <View style={styles.skeletonLoadingLabel}>
                        <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                        <Text style={styles.skeletonLoadingText}>Loading ISO list…</Text>
                      </View>
                      <View style={styles.skeletonIsoList}>
                        {[1, 2, 3].map((i) => (
                          <View key={i} style={styles.skeletonIsoRow}>
                            <SkeletonBox width={72} height={100} borderRadius={RADIUS.md} />
                            <View style={{ flex: 1, marginLeft: SPACING.md }}>
                              <SkeletonBox width="80%" height={16} borderRadius={4} style={{ marginBottom: SPACING.sm }} />
                              <SkeletonBox width="50%" height={12} borderRadius={4} />
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : isoItems.length > 0 ? (
                    <>
                      <View style={styles.isoSeparator} />
                      {isoItems.map((isoItem, index) => {
                        const imageUri = isoItem.image
                          || getPokemonTcgImageUrlFromSetNumberIfOnCdn(isoItem.set, isoItem.cardNumber)
                          || null
                        return (
                          <View key={isoItem.id}>
                            <View style={styles.isoItem}>
                              <View style={styles.isoItemImageWrap}>
                                {imageUri ? (
                                  <Image
                                    source={{ uri: imageUri }}
                                    style={styles.isoCardImage}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <View style={styles.isoCardImagePlaceholder}>
                                    <Ionicons name="image-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
                                    <Text style={styles.isoCardImageFallbackText} numberOfLines={2}>{isoItem.cardName}</Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.isoItemTextBlock}>
                                <Text style={styles.isoItemTitle} numberOfLines={1}>
                                  {isoItem.cardName || 'Unnamed card'}
                                </Text>

                                <View style={styles.isoDetailRow}>
                                  <Text style={styles.isoDetailLabel}>Set</Text>
                                  <Text style={styles.isoDetailValue} numberOfLines={1}>
                                    {isoItem.set || '—'}
                                  </Text>
                                </View>

                                <View style={styles.isoDetailRow}>
                                  <Text style={styles.isoDetailLabel}>Card #</Text>
                                  <Text style={styles.isoDetailValue} numberOfLines={1}>
                                    {isoItem.cardNumber || '—'}
                                  </Text>
                                </View>

                                <View style={styles.isoPriceRow}>
                                  <Text style={styles.isoPriceLabel}>Market</Text>
                                  <View style={styles.isoPricePill}>
                                    <Text style={styles.isoPriceText} numberOfLines={1}>
                                      {isoItem.marketPrice != null
                                        ? formatIsoPrice(Number(isoItem.marketPrice))
                                        : '—'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                            {index < isoItems.length - 1 && <View style={styles.isoSeparator} />}
                          </View>
                        )
                      })}
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
              <StoreStats
                totalSales={store.totalSales || 0}
                totalRevenue={totalRevenue}
                responseTime="2h"
                reviewPercentage={store.rating ? Math.round(parseFloat(store.rating) * 20) : 98}
              />

              <Section
                title="My Listings"
                rightContent={
                  <>
                    <SafetyFilter
                      enabled={vaultedOnly}
                      onToggle={setVaultedOnly}
                      compact
                    />
                    <ShareLinkButton storeLink={shareableLink} />
                  </>
                }
              >
                {listingsLoading && !listingsHasLoadedOnce ? (
                  <>
                    <View style={styles.skeletonLoadingLabel}>
                      <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                      <Text style={styles.skeletonLoadingText}>Loading your listings…</Text>
                    </View>
                    <View style={styles.skeletonListingsRow}>
                      {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.skeletonListingCard}>
                          <SkeletonBox width="100%" height={100} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
                          <SkeletonBox width={60} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                          <SkeletonBox width="70%" height={12} borderRadius={4} />
                        </View>
                      ))}
                    </View>
                  </>
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
                          storeName,
                          fromMyStore: true,
                          listingId: String(listing.id),
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
                {ordersLoading && !ordersHasLoadedOnce ? (
                  <>
                    <View style={styles.skeletonLoadingLabel}>
                      <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                      <Text style={styles.skeletonLoadingText}>Loading orders…</Text>
                    </View>
                    <View style={styles.skeletonOrdersList}>
                      {[1, 2].map((i) => (
                        <SkeletonBox key={i} width="100%" height={88} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
                      ))}
                    </View>
                  </>
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
                {ordersLoading && !ordersHasLoadedOnce ? (
                  <>
                    <View style={styles.skeletonLoadingLabel}>
                      <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                      <Text style={styles.skeletonLoadingText}>Loading orders…</Text>
                    </View>
                    <View style={styles.skeletonOrdersList}>
                      {[1, 2].map((i) => (
                        <SkeletonBox key={i} width="100%" height={88} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
                      ))}
                    </View>
                  </>
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
        </>
        ) : null}
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
          onList={async (price, listingImageUri, listingPhotos) => {
            if (editingListing) {
              await updateListing(editingListing.id, { price })
            } else {
              if (!listingImageUri || !listingPhotos) {
                Alert.alert('Photos required', 'Please add all 3 photos (front, back, up close) to list your card.')
                throw new Error('Photos required')
              }
              await createListing(selectedProduct.name, price, { uri: listingImageUri }, listingPhotos)
            }
            setIsListItemModalVisible(false)
            setSelectedProduct(null)
            setEditingListing(null)
          }}
          onRemoveListing={editingListing ? async () => await removeListing(String(editingListing.id)) : undefined}
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
        apiBaseUrl={DOMAIN}
      />

      {/* Edit store details modal */}
      <Modal
        visible={isEditStoreModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <CardContent style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit store details</Text>
              <Text style={styles.modalSubtitle}>
                Store name and social links (Twitch & YouTube are optional).
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Store name (required)"
                placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                value={editStoreName}
                onChangeText={setEditStoreName}
              />
              <View style={styles.modalInputRow}>
                <View style={styles.modalInputIcon}>
                  <Ionicons name="logo-twitch" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'} />
                </View>
                <TextInput
                  style={[styles.modalInput, styles.modalInputInRow]}
                  placeholder="Twitch URL (optional)"
                  placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                  value={editTwitchUrl}
                  onChangeText={setEditTwitchUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <View style={styles.modalInputRow}>
                <View style={styles.modalInputIcon}>
                  <Ionicons name="logo-youtube" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'} />
                </View>
                <TextInput
                  style={[styles.modalInput, styles.modalInputInRow]}
                  placeholder="YouTube URL (optional)"
                  placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                  value={editYoutubeUrl}
                  onChangeText={setEditYoutubeUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setIsEditStoreModalVisible(false)}
                  disabled={updatingStore}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, !editStoreName.trim() && styles.modalButtonDisabled]}
                  onPress={updateStoreDetails}
                  disabled={updatingStore || !editStoreName.trim()}
                >
                  {updatingStore ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>Save</Text>
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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING['4xl'],
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: SPACING.lg,
    marginBottom: SPACING['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  tabPill: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: theme.tintColor || '#73EC8B',
  },
  tabPillText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  tabPillTextActive: {
    color: '#000000',
  },
  contentWrapper: {
    width: '100%',
    paddingTop: SPACING.lg,
  },
  skeletonHeader: {
    marginBottom: SPACING.lg,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: SPACING.lg,
  },
  skeletonHeaderText: {
    flex: 1,
  },
  skeletonLoadingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  skeletonLoadingText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)',
  },
  skeletonListingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skeletonListingCard: {
    width: '31%',
    minWidth: 0,
  },
  skeletonAuctionList: {
    width: '100%',
  },
  skeletonIsoList: {
    width: '100%',
  },
  skeletonIsoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  skeletonOrdersList: {
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
  addISOButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
    borderRadius: 0,
    borderWidth: 0,
    gap: SPACING.xs,
  },
  addISOText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.55)',
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
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  isoItemImageWrap: {
    width: 72,
    height: 100,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  isoCardImage: {
    width: '100%',
    height: '100%',
  },
  isoCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  isoCardImageFallbackText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  isoItemTextBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  isoItemTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: SPACING.xs,
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
    minWidth: 48,
  },
  isoDetailValue: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    flex: 1,
  },
  isoPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  isoPriceLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  isoPricePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(115, 236, 139, 0.1)',
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
  },
  isoPriceText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
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
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalInputIcon: {
    marginRight: SPACING.sm,
  },
  modalInputInRow: {
    marginBottom: 0,
    flex: 1,
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
  modalButtonDisabled: {
    opacity: 0.5,
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
