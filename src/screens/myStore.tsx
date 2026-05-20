import { useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../components/ui/text'
import { ThemeContext } from '../context'
import {
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  TILE_BORDER_WHITE,
  TILE_BORDER_WIDTH,
  MODAL_INNER_TILE_BORDER,
} from '../constants/layout'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AuctionSection, CreateAuctionModal, type Auction, OrderCard, type Order, ListItemModal } from '../components/profile'
import { Section } from '../components/layout/Section'
import { AppButton } from '../components/ui/AppButton'
import { SkeletonBox } from '../components/layout/SkeletonBox'
import {
  StoreHeader,
  StoreStats,
  StoreListings,
  SafetyFilter,
  ShareLinkButton,
  CreateStoreModal,
  IsoCatalogSearch,
} from '../components/store'
import { IsoListItem } from '../components/store/IsoListItem'
import { type StoreListing } from '../components/store/StoreListings'
import { DOMAIN } from '../../constants'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage, isExternalUrl } from '../utils/imageUpload'
import { authClient } from '../lib/auth-client'
import { getPokemonTcgImageUrlFromSetNumberIfOnCdn } from '../utils/pokemonTcgImages'
import { androidLabelStyle, isAndroid } from '../utils/platformHelpers'

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
    listingId?: string
    cardId?: string
    purchaseType?: 'instant' | 'auction' | 'bid' | 'both'
    currentBid?: number
  }
  EditProfile: undefined
  EditPhone: undefined
  EditPudoAddress: undefined
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
  const [activeTab, setActiveTab] = useState('STORE')
  const [vaultedOnly, setVaultedOnly] = useState(false)
  const [isListItemModalVisible, setIsListItemModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; image?: any } | null>(null)
  const [isCreateAuctionModalVisible, setIsCreateAuctionModalVisible] = useState(false)
  const [editingListing, setEditingListing] = useState<StoreListing | null>(null)
  const [isoAddingCardId, setIsoAddingCardId] = useState<string | null>(null)

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

  // Edit store details modal (store name + banner + optional Twitch/YouTube URLs)
  const [isEditStoreModalVisible, setIsEditStoreModalVisible] = useState(false)
  const [editStoreName, setEditStoreName] = useState('')
  const [editBannerUrl, setEditBannerUrl] = useState<string | null>(null)
  const [editTwitchUrl, setEditTwitchUrl] = useState('')
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('')
  const [updatingStore, setUpdatingStore] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

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
          setIsCreateStoreModalVisible(false)
        } else {
          setStore(null)
          setIsCreateStoreModalVisible(true)
        }
      } else {
        setStore(null)
        if (response.status === 404) {
          setIsCreateStoreModalVisible(true)
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch store')
        }
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
    setEditBannerUrl(store.bannerUrl || null)
    setEditTwitchUrl(store.twitchUrl || '')
    setEditYoutubeUrl(store.youtubeUrl || '')
    setIsEditStoreModalVisible(true)
  }

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your profile picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return
    setAvatarUploading(true)
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }
      const imageUrl = await uploadImage(result.assets[0].uri, 'gradeit/avatars')
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ avatar: imageUrl }),
      })
      const data = await response.json()
      if (response.ok) {
        await fetchStore({ silent: true })
        Alert.alert('Saved', 'Profile picture updated.')
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile picture')
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload profile picture')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleChangeBanner = async () => {
    if (!store) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your store banner.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [3, 1],
    })
    if (result.canceled || !result.assets[0]) return
    setBannerUploading(true)
    try {
      const imageUrl = await uploadImage(result.assets[0].uri, 'gradeit/banners')
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return
      }
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ bannerUrl: imageUrl }),
      })
      const data = await response.json()
      if (response.ok && data.store) {
        setStore(data.store)
        setEditBannerUrl(data.store.bannerUrl || imageUrl)
        Alert.alert('Saved', 'Store banner updated.')
      } else {
        Alert.alert('Error', data.message || 'Failed to update banner')
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload banner')
    } finally {
      setBannerUploading(false)
    }
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
          bannerUrl: editBannerUrl ?? store?.bannerUrl ?? undefined,
          twitchUrl: editTwitchUrl.trim() === '' ? null : editTwitchUrl.trim() || undefined,
          youtubeUrl: editYoutubeUrl.trim() === '' ? null : editYoutubeUrl.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        if (data.store) setStore(data.store)
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
          id: String(listing.id),
          listingId: listing.listingId ?? listing.id,
          cardName: listing.cardName,
          cardImage: listing.cardImage
            ? { uri: listing.cardImage }
            : require('../../assets/singles/Shining_Charizard_Secret.jpg'),
          cardId: listing.cardId || undefined,
          price: parseFloat(String(listing.price || '0')),
          quantity:
            listing.quantity != null ? Math.max(1, Math.floor(Number(listing.quantity))) : 1,
          setName: listing.setName,
          cardNumber: listing.cardNumber,
          condition: listing.condition,
          metaLine: listing.metaLine,
          finishLabel: listing.finishLabel,
          marketPrice: listing.marketPrice,
          ebayLastSold: listing.ebayLastSold,
          vaultingStatus: listing.vaultingStatus || 'seller-has',
          purchaseType: listing.purchaseType || 'both',
          currentBid: listing.currentBid ? parseFloat(String(listing.currentBid)) : undefined,
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
  const createListing = async (
    cardName: string,
    price: number,
    cardImage?: any,
    listingPhotos?: { front: string; back: string; close: string },
    quantity?: number
  ) => {
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
          quantity: quantity != null && quantity > 0 ? Math.floor(quantity) : 1,
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
          ...(updates.quantity != null && { quantity: updates.quantity }),
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
  const createISOItem = async (
    cardName: string,
    cardNumber?: string,
    set?: string,
    image?: string,
  ): Promise<boolean> => {
    try {
      const token = await getSessionToken()
      if (!token) {
        Alert.alert('Error', 'Please log in')
        return false
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
          image: image || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchISOItems()
        return true
      }
      Alert.alert('Error', data.message || 'Failed to add ISO item')
      return false
    } catch (error: any) {
      console.error('Error creating ISO item:', error)
      Alert.alert('Error', 'Failed to add ISO item')
      return false
    }
  }

  const handleIsoCatalogAdd = async (pick: {
    cardName: string
    cardNumber?: string
    set?: string
    image?: string
    catalogId?: string
  }) => {
    setIsoAddingCardId(pick.catalogId ?? null)
    const ok = await createISOItem(pick.cardName, pick.cardNumber, pick.set, pick.image)
    setIsoAddingCardId(null)
    if (ok) {
      Alert.alert('Added', `${pick.cardName} added to your ISO list.`)
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
    try {
      await fetchStore({ silent: true })
      if (store) {
        if (activeTab === 'STORE') await fetchListings()
        else if (activeTab === 'ORDERS') await fetchOrders()
        else if (activeTab === 'AUCTIONS') await fetchAuctions()
        else if (activeTab === 'ISO') await fetchISOItems()
      }
    } finally {
      setRefreshing(false)
    }
  }, [store, activeTab])

  // Load data when store is available and tab changes
  useEffect(() => {
    if (store) {
      if (activeTab === 'STORE') {
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

  const tabs = ['AUCTIONS', 'STORE', 'ISO', 'ORDERS']

  const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17
  const formatIsoPrice = (usd: number) => `R${Math.round(usd * USD_TO_ZAR).toLocaleString('en-ZA')}`

  // Default store name from session when opening create-store flow
  useEffect(() => {
    const loadDefaultStoreName = async () => {
      if (store || newStoreName.trim()) return
      try {
        const session = await authClient.getSession()
        const user = session?.data?.user as { name?: string; firstName?: string; lastName?: string } | undefined
        if (!user) return
        const fromParts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
        const base = fromParts || user.name?.trim() || 'My'
        setNewStoreName(`${base}'s Card Shop`)
      } catch {
        // ignore
      }
    }
    if (!store && !storeLoading) {
      loadDefaultStoreName()
    }
  }, [store, storeLoading, newStoreName])

  const showCreateStoreGate = !store && !storeLoading

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
      <CreateStoreModal
        visible={showCreateStoreGate || isCreateStoreModalVisible}
        required={showCreateStoreGate}
        storeName={newStoreName}
        twitchUrl={newTwitchUrl}
        youtubeUrl={newYoutubeUrl}
        creating={creatingStore}
        onStoreNameChange={setNewStoreName}
        onTwitchUrlChange={setNewTwitchUrl}
        onYoutubeUrlChange={setNewYoutubeUrl}
        onCreate={createStore}
      />
      {!showCreateStoreGate ? (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textColor}
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
                <ActivityIndicator size="small" color={theme.textColor} />
                <Text style={styles.skeletonLoadingText}>Loading your store…</Text>
              </View>
              <SkeletonBox width="100%" height={64} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.lg }} />
              <View style={styles.skeletonListingsRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.skeletonListingCard}>
                    <SkeletonBox width="100%" borderRadius={RADIUS.sm} style={{ aspectRatio: 1, marginBottom: SPACING.xs }} />
                    <SkeletonBox width={48} height={10} borderRadius={4} style={{ marginBottom: 3 }} />
                    <SkeletonBox width="85%" height={10} borderRadius={4} />
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
          bannerUrl={store.bannerUrl ? { uri: store.bannerUrl } : undefined}
          profileImage={store.user?.avatar ? { uri: store.user.avatar } : undefined}
          profileInitials={store.user?.firstName?.[0] || store.user?.name?.[0] || 'U'}
          level={userLevel}
          currentXP={currentXP}
          xpToNextLevel={xpToNextLevel}
          salesCount={salesCount}
          shareableLink={shareableLink}
          showBannerEdit={true}
          onBannerEditPress={openEditStoreModal}
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
            <Section title="Auctions" compact>
              {auctionsLoading && !auctionsHasLoadedOnce ? (
                <>
                  <View style={styles.skeletonLoadingLabel}>
                    <ActivityIndicator size="small" color={theme.textColor} />
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
            <Section title="In Search Of" showSeeAll={false} compact>
              <IsoCatalogSearch
                apiBaseUrl={DOMAIN}
                onAdd={handleIsoCatalogAdd}
                addingCardId={isoAddingCardId}
              />
              {isoItems.length > 0 ? (
                <Text style={styles.isoListHeading}>Your ISO list</Text>
              ) : null}
              {isoLoading && !isoHasLoadedOnce ? (
                <>
                  <View style={styles.skeletonLoadingLabel}>
                    <ActivityIndicator size="small" color={theme.textColor} />
                    <Text style={styles.skeletonLoadingText}>Loading ISO list…</Text>
                  </View>
                  <View style={styles.skeletonIsoList}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={styles.skeletonIsoRow}>
                        <SkeletonBox width={40} height={52} borderRadius={RADIUS.sm} />
                        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                          <SkeletonBox width="75%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                          <SkeletonBox width="45%" height={10} borderRadius={4} />
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : isoItems.length > 0 ? (
                <View style={styles.isoListWrap}>
                  {isoItems.map((isoItem, index) => {
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
                  })}
                </View>
              ) : (
                <Text style={styles.emptyTextCompact}>No ISO items yet</Text>
              )}
            </Section>
          )}

          {activeTab === 'STORE' && (
            <>
              <StoreStats
                totalSales={store.totalSales || 0}
                totalRevenue={totalRevenue}
                responseTime="2h"
                reviewPercentage={store.rating ? Math.round(parseFloat(store.rating) * 20) : 98}
              />

              <Section
                title="My Listings"
                compact
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
                      <ActivityIndicator size="small" color={theme.textColor} />
                      <Text style={styles.skeletonLoadingText}>Loading your listings…</Text>
                    </View>
                    <View style={styles.skeletonListingsRow}>
                      {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.skeletonListingCard}>
                          <SkeletonBox width="100%" borderRadius={RADIUS.sm} style={{ aspectRatio: 1, marginBottom: SPACING.xs }} />
                          <SkeletonBox width={48} height={10} borderRadius={4} style={{ marginBottom: 3 }} />
                          <SkeletonBox width="85%" height={10} borderRadius={4} />
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
                          description: listing.cardName,
                          storeName,
                          fromMyStore: true,
                          listingId: String(listing.id),
                          cardId: listing.cardId,
                          setName: listing.setName,
                          cardNumber: listing.cardNumber,
                          purchaseType: listing.purchaseType,
                          currentBid: listing.currentBid,
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
              <Section title="Ongoing Orders" compact>
                {ordersLoading && !ordersHasLoadedOnce ? (
                  <>
                    <View style={styles.skeletonLoadingLabel}>
                      <ActivityIndicator size="small" color={theme.textColor} />
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

              <Section title="Completed Orders" compact>
                {ordersLoading && !ordersHasLoadedOnce ? (
                  <>
                    <View style={styles.skeletonLoadingLabel}>
                      <ActivityIndicator size="small" color={theme.textColor} />
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
      ) : null}

      {/* List Item Modal */}
      {selectedProduct && (
        <ListItemModal
          visible={isListItemModalVisible}
          productName={selectedProduct.name}
          productImage={selectedProduct.image}
          initialPrice={editingListing?.price}
          initialDescription={editingListing ? editingListing.cardName : undefined}
          onClose={() => {
            setIsListItemModalVisible(false)
            setSelectedProduct(null)
            setEditingListing(null)
          }}
          initialQuantity={editingListing?.quantity}
          onList={async (price, listingImageUri, listingPhotos, quantity) => {
            if (editingListing) {
              await updateListing(editingListing.id, {
                price,
                quantity: quantity ?? editingListing.quantity,
              })
            } else {
              if (!listingImageUri || !listingPhotos) {
                Alert.alert('Photos required', 'Please add all 3 photos (front, back, up close) to list your card.')
                throw new Error('Photos required')
              }
              await createListing(selectedProduct.name, price, { uri: listingImageUri }, listingPhotos, quantity)
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

      {/* Edit store details modal */}
      <Modal
        visible={isEditStoreModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            style={styles.modalKeyboardScroll}
            contentContainerStyle={styles.modalKeyboardScrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bottomOffset={56}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.modalCard}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit store details</Text>
              <View style={styles.modalAvatarSection}>
                <Text style={styles.modalSectionLabel}>Profile picture</Text>
                <View style={styles.modalAvatarCenter}>
                  <TouchableOpacity
                    onPress={handleChangeAvatar}
                    disabled={avatarUploading}
                    activeOpacity={0.8}
                    style={styles.modalAvatarTouch}
                  >
                    {avatarUploading ? (
                      <View style={[styles.modalAvatar, styles.modalAvatarUploading]}>
                        <ActivityIndicator size="small" color={theme.textColor} />
                      </View>
                    ) : store?.user?.avatar ? (
                      <Image
                        source={{ uri: store.user.avatar }}
                        style={styles.modalAvatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.modalAvatar, styles.modalAvatarEmpty]}>
                        <Ionicons name="person-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
                        <Text style={styles.modalAvatarPlaceholderText}>Tap to add photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.modalMediaSection}>
                <Text style={styles.modalSectionLabel}>Store banner</Text>
                <TouchableOpacity
                  onPress={handleChangeBanner}
                  disabled={bannerUploading}
                  activeOpacity={0.8}
                  style={styles.modalBannerTouch}
                >
                  {bannerUploading ? (
                    <View style={[styles.modalBannerPlaceholder, styles.modalBannerUploading]}>
                      <ActivityIndicator size="small" color={theme.textColor} />
                      <Text style={styles.modalBannerPlaceholderText}>Uploading…</Text>
                    </View>
                  ) : (editBannerUrl || store?.bannerUrl) ? (
                    <Image
                      source={{ uri: editBannerUrl || store?.bannerUrl }}
                      style={styles.modalBannerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.modalBannerPlaceholder}>
                      <Ionicons name="image-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
                      <Text style={styles.modalBannerPlaceholderText}>Tap to add banner</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.modalStoreNameSection}>
                <Text style={styles.modalSectionLabel}>Store name</Text>
                <View style={[styles.modalFieldTile, styles.modalFieldTileInSection]}>
                <TextInput
                  style={styles.modalFieldInput}
                  placeholder="Store name (required)"
                  placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'}
                  value={editStoreName}
                  onChangeText={setEditStoreName}
                />
                </View>
              </View>
              <View style={styles.modalFieldTile}>
                <Ionicons name="logo-twitch" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'} />
                <TextInput
                  style={styles.modalFieldInput}
                  value={editTwitchUrl}
                  onChangeText={setEditTwitchUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <View style={styles.modalFieldTile}>
                <Ionicons name="logo-youtube" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)'} />
                <TextInput
                  style={styles.modalFieldInput}
                  value={editYoutubeUrl}
                  onChangeText={setEditYoutubeUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <View style={styles.modalActions}>
                <AppButton
                  variant="outline"
                  size="md"
                  label="Cancel"
                  onPress={() => setIsEditStoreModalVisible(false)}
                  disabled={updatingStore}
                  onDarkSurface
                />
                <AppButton
                  variant="outline"
                  size="md"
                  label={updatingStore ? 'Saving…' : 'Save'}
                  onPress={updateStoreDetails}
                  disabled={updatingStore || !editStoreName.trim()}
                  onDarkSurface
                />
              </View>
            </View>
          </View>
          </KeyboardAwareScrollView>
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
    paddingBottom: SPACING.screenBottom,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  tabPill: {
    flex: 1,
    height: 28,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: theme.buttonFilledBg || '#FFFFFF',
  },
  tabPillText: {
    fontSize: TYPOGRAPHY.label,
    lineHeight: isAndroid ? 14 : TYPOGRAPHY.label,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    textAlign: 'center',
    ...androidLabelStyle,
  },
  tabPillTextActive: {
    color: theme.buttonFilledFg || '#000000',
  },
  contentWrapper: {
    width: '100%',
    paddingTop: SPACING.sm,
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
    paddingVertical: SPACING.xs,
  },
  isoListHeading: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  isoListWrap: {
    marginTop: SPACING.xs,
  },
  emptyTextCompact: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: SPACING.sm,
    textAlign: 'center',
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  isoCardContent: {
    padding: SPACING.cardPadding,
  },
  isoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  isoItemImageWrap: {
    width: 56,
    height: 76,
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
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: 0,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.2)',
  },
  isoPriceText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
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
  },
  modalKeyboardScroll: {
    flex: 1,
  },
  modalKeyboardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: theme.cardBackground || '#1a1a1a',
    borderRadius: RADIUS.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    alignSelf: 'center',
    borderWidth: TILE_BORDER_WIDTH,
    borderColor: TILE_BORDER_WHITE,
    overflow: 'hidden',
  },
  modalContent: {
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  modalAvatarSection: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  modalAvatarCenter: {
    width: '100%',
    alignItems: 'center',
  },
  modalMediaSection: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  modalSectionLabel: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: SPACING.xs,
    fontWeight: '600',
    alignSelf: 'flex-start',
    textAlign: 'left',
  },
  modalStoreNameSection: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  modalAvatarTouch: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: TILE_BORDER_WIDTH,
    borderColor: MODAL_INNER_TILE_BORDER,
  },
  modalAvatar: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: theme.cardBackground || '#000',
  },
  modalAvatarUploading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalAvatarPlaceholderText: {
    fontSize: 10,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: SPACING.xs,
  },
  modalBannerTouch: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: TILE_BORDER_WIDTH,
    borderColor: MODAL_INNER_TILE_BORDER,
  },
  modalBannerImage: {
    width: '100%',
    height: 80,
    backgroundColor: theme.cardBackground || '#000',
  },
  modalBannerPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBannerUploading: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalBannerPlaceholderText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: SPACING.xs,
  },
  modalFieldTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: '100%',
    minHeight: 48,
    backgroundColor: theme.backgroundColor || '#000',
    borderRadius: RADIUS.md,
    borderWidth: TILE_BORDER_WIDTH,
    borderColor: MODAL_INNER_TILE_BORDER,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  modalFieldTileInSection: {
    marginBottom: 0,
  },
  modalFieldInput: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'center',
    color: theme.textColor,
    fontSize: TYPOGRAPHY.body,
    lineHeight: isAndroid ? TYPOGRAPHY.body : TYPOGRAPHY.body * 1.2,
    fontFamily: theme.regularFont,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    borderWidth: 0,
    textAlignVertical: 'center',
    ...androidLabelStyle,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: theme.buttonFilledBg || '#FFFFFF',
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
    color: theme.buttonFilledFg || '#000000',
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
})
