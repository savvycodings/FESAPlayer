import React, { useContext, useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl, ActivityIndicator, Platform } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../components/ui/text'
import { ThemedText } from '../components/ui/ThemedText'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { isAndroid } from '../utils/platformHelpers'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ProfileHeader, ProductGrid, AddCardModal, BulkVaultingModal } from '../components/profile'
import { PayFastPayment } from '../components/payment'
import { SkeletonBox } from '../components/layout/SkeletonBox'
import { Section } from '../components/layout/Section'
import { AppButton } from '../components/ui/AppButton'
import { DOMAIN } from '../../constants'
import { PROFILE_REFRESH_STALE_LIMIT } from '../lib/cardPrices'
import { CARD_PLACEHOLDER_IMAGE } from '../constants/cardPlaceholder'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage, isExternalUrl } from '../utils/imageUpload'
import { createCollectionListing } from '../utils/createCollectionListing'
import { getPokemonTcgImageUrl, getPokemonTcgImageUrlFromSetNumberIfOnCdn } from '../utils/pokemonTcgImages'
import { authClient } from '../lib/auth-client'

type ProfileStackParamList = {
  ProfileMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    ebayPrice?: number
    description?: string
    set?: string
    fromProfile?: boolean
    isListed?: boolean
    marketPriceUsd?: number
  }
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

export function Profile() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ProfileScreenNavigationProp>()
  const styles = getStyles(theme)
  // State for user data
  const [user, setUser] = useState<any>(null)
  const [collections, setCollections] = useState<any[]>([])
  const [stats, setStats] = useState({ cards: 0, sealed: 0, slabs: 0, total: 0 })
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [portfolioData, setPortfolioData] = useState<{ x: number; y: number }[]>([])
  const [portfolioDates, setPortfolioDates] = useState<string[]>([])
  const [setDistribution, setSetDistribution] = useState<{ label: string; value: number }[]>([])
  const [isAddCardModalVisible, setIsAddCardModalVisible] = useState(false)
  const [isBulkVaultingModalVisible, setIsBulkVaultingModalVisible] = useState(false)
  // Verify (R100) payment modal after bulk vault or add-card with request verification
  const [isVerifyPaymentVisible, setIsVerifyPaymentVisible] = useState(false)
  const [verifyVaultedRequestIds, setVerifyVaultedRequestIds] = useState<number[]>([])
  const [verifyBuyer, setVerifyBuyer] = useState<{ id: string; email: string; firstName: string; lastName: string } | null>(null)
  const [verifyPudoLocker, setVerifyPudoLocker] = useState('')
  const [verifyPudoAddress, setVerifyPudoAddress] = useState('')

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
  const fetchCollections = async (options?: { silent?: boolean; refreshStale?: boolean }) => {
    const silent = options?.silent === true
    const refreshStale = options?.refreshStale !== false
    try {
      if (!silent) setLoading(true)
      // Check session
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        if (!silent) setLoading(false)
        setCollections([])
        setStats({ cards: 0, sealed: 0, slabs: 0, total: 0 })
        setPortfolioValue(0)
        setSetDistribution([])
        return
      }

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
        collectionsData.forEach((c: any, i: number) => {
          console.log('[Profile] API collection', i, c.name, '| cardId:', c.cardId, '| marketPrice:', c.marketPrice, '| ebayLastSold:', c.ebayLastSold)
        })
        setCollections(collectionsData)
        setStats(data.stats || { cards: 0, sealed: 0, slabs: 0, total: 0 })
        setPortfolioValue(data.portfolioValue || 0)

        // Set distribution from API
        const distribution = (data.setDistribution || []).map((item: any) => ({
          label: item.label,
          value: item.value,
        }))
        setSetDistribution(distribution)

        // Portfolio chart history comes from fetchPortfolioHistory only
      } else {
        console.error('Error fetching collections:', data.message)
        // Set defaults on error
        setCollections([])
        setStats({ cards: 0, sealed: 0, slabs: 0, total: 0 })
        setPortfolioValue(0)
        setSetDistribution([])
      }
    } catch (error: any) {
      console.error('Error fetching collections:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Fetch aggregated portfolio history for chart (from card_price_history)
  const fetchPortfolioHistory = async () => {
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        setPortfolioData([])
        setPortfolioDates([])
        return
      }
      const sessionToken = session.data.session.token
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const response = await fetch(`${baseUrl}/api/profile/portfolio/history?days=90`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data.history)) {
        setPortfolioData([])
        setPortfolioDates([])
        return
      }
      const history = data.history as { date?: string; totalMarketPriceUsd?: number | null }[]
      if (history.length === 0) {
        setPortfolioData([])
        setPortfolioDates([])
        return
      }
      const dates = history.map((h) => (h.date ? String(h.date).slice(0, 10) : ''))
      const points = history.map((h, index) => {
        const usd = h.totalMarketPriceUsd != null ? Number(h.totalMarketPriceUsd) : 0
        const valueZar = usd > 0 ? Math.round(usd * USD_TO_ZAR) : 0
        return { x: index, y: valueZar }
      })
      setPortfolioData(points)
      setPortfolioDates(dates)
    } catch (error) {
      console.error('Error fetching portfolio history:', error)
      setPortfolioData([])
      setPortfolioDates([])
    }
  }

  // Add card to collection (payload from AddCardModal: type, name, set, cardNumber, image, cardId, etc.)
  const addCardToCollection = async (data: {
    type: 'card' | 'sealed' | 'slab'
    name: string
    description?: string
    image?: string
    cardId?: string
    set?: string
    cardNumber?: string
    condition?: string
    grade?: number
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
      const payload = { ...data, image: imageUrl }
      console.log('[Add Card] Sending to API:', {
        url: `${baseUrl}/api/profile/collections`,
        body: {
          type: payload.type,
          name: payload.name,
          cardId: payload.cardId ?? null,
          set: payload.set ?? null,
          condition: payload.condition ?? null,
          grade: payload.grade ?? null,
          hasImage: !!payload.image,
          requestVaulting: payload.requestVaulting ?? false,
        },
      })
      const response = await fetch(`${baseUrl}/api/profile/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`, // Send session token for mobile
        },
        credentials: 'include', // Include cookies for web
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()
      console.log('[Add Card] API response:', {
        ok: response.ok,
        status: response.status,
        data: responseData.success
          ? { success: true, collectionId: responseData.collection?.id, message: 'Card added' }
          : { success: false, message: responseData.message },
      })

      if (response.ok) {
        await fetchCollections({ silent: true })
        await fetchUserProfile()
        return responseData as { success: boolean; collection?: { id: number }; vaultedRequestId?: number }
      } else {
        throw new Error(responseData.message || 'Failed to add card')
      }
    } catch (error: any) {
      console.error('Error adding card:', error)
      throw error
    }
  }

  const createListing = async (
    cardName: string,
    price: number,
    cardImage?: any,
    cardId?: string,
    collectionId?: number,
    listingPhotos?: { front: string; back: string; close: string },
    quantity?: number
  ) => {
    const ok = await createCollectionListing(
      cardName,
      price,
      cardImage,
      cardId,
      collectionId,
      listingPhotos,
      quantity
    )
    if (ok) await fetchCollections()
  }

  // Request verification for multiple cards
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
        setIsBulkVaultingModalVisible(false)
        const requests = data.requests || []
        const ids = requests.map((r: { id: number }) => r.id).filter((id: number) => id != null)
        if (ids.length === 0) {
          Alert.alert('Success', `Verification request created for ${collectionIds.length} ${collectionIds.length === 1 ? 'card' : 'cards'}!`)
          await fetchCollections()
          return
        }
        const u = (session?.data as any)?.user
        if (!u?.id || !u?.email) {
          Alert.alert('Error', 'Please ensure your profile has an email set to complete verification payment.')
          await fetchCollections()
          return
        }
        const nameParts = (u.name || 'User').trim().split(' ')
        setVerifyBuyer({
          id: u.id,
          email: u.email,
          firstName: u.firstName ?? nameParts[0] ?? 'User',
          lastName: u.lastName ?? nameParts.slice(1).join(' ') ?? '',
        })
        setVerifyPudoLocker(user?.pudoLockerCode ?? '')
        setVerifyPudoAddress(user?.pudoAddress ?? '')
        setVerifyVaultedRequestIds(ids)
        setIsVerifyPaymentVisible(true)
        await fetchCollections()
      } else {
        Alert.alert('Error', data.message || 'Failed to create verification request')
      }
    } catch (error: any) {
      console.error('Error requesting bulk verification:', error)
      Alert.alert('Error', 'Failed to create verification request')
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

  const loadProfileMarketData = useCallback(async (options?: { silent?: boolean }) => {
    await fetchCollections({ silent: options?.silent, refreshStale: true })
    await fetchPortfolioHistory()
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchUserProfile()
    void loadProfileMarketData()
  }, [loadProfileMarketData])

  // Refresh when tab focused — stale prices first, then portfolio chart
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile()
      void loadProfileMarketData({ silent: true })
    }, [loadProfileMarketData]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchUserProfile()
    await loadProfileMarketData({ silent: true })
    setRefreshing(false)
  }, [loadProfileMarketData])

  // Price from API/cache (marketPrice USD → ZAR) when cardId set; else legacy or R0. Only hit API every 48h; data lives in DB.
  const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17
  const products = collections.map((collection: any) => {
    const marketPriceUsd = collection.marketPrice ?? collection.market_price
    const ebayLastSoldUsd = collection.ebayLastSold ?? collection.ebay_last_sold
    const marketNum = marketPriceUsd != null && marketPriceUsd !== '' ? Number(marketPriceUsd) : null
    const ebayNum = ebayLastSoldUsd != null && ebayLastSoldUsd !== '' ? Number(ebayLastSoldUsd) : null
    // When API returns marketPrice 0 but eBay has value, use eBay so we don't show R0
    const primaryUsd = (marketNum != null && marketNum > 0) ? marketNum : (ebayNum != null && ebayNum > 0 ? ebayNum : null)
    const valueZar = primaryUsd != null
      ? Math.round(primaryUsd * USD_TO_ZAR)
      : parseFloat(collection.estimatedValue || collection.purchasePrice || '0') || 0
    const ebayZar = ebayNum != null ? Math.round(ebayNum * USD_TO_ZAR) : null
    const priceStr =
      valueZar > 0 ? `R${valueZar.toLocaleString('en-ZA')} ZAR` : 'R0'
    let priceChangeZar: number | null = null
    let priceChangePercent: number | null = null
    if (
      valueZar > 0 &&
      ebayZar != null &&
      ebayZar > 0 &&
      valueZar !== ebayZar
    ) {
      priceChangeZar = valueZar - ebayZar
      priceChangePercent = (priceChangeZar / ebayZar) * 100
    }
    const setLabel = collection.set?.trim() || undefined
    const cardNum = collection.cardNumber ?? collection.number
    const cardNumberLabel =
      cardNum != null && String(cardNum).trim() !== '' ? String(cardNum).trim() : undefined
    const metaParts: string[] = []
    if (collection.type === 'slab' && collection.grade != null) {
      metaParts.push(`PSA ${collection.grade}`)
    } else if (collection.type && collection.type !== 'card') {
      metaParts.push(collection.type.charAt(0).toUpperCase() + collection.type.slice(1))
    }
    const metaLine = metaParts.length > 0 ? metaParts.join(' • ') : undefined
    const finishLabel =
      collection.type === 'slab'
        ? 'Slab'
        : collection.type === 'sealed'
          ? 'Sealed'
          : undefined
    // Same logic for every card: prefer server cardImageUrl (API or cached), then built URL only when set is on CDN, then cardId-based URL.
    const cardImageUrl = collection.cardImageUrl ?? null
    const setForBuild = collection.set ?? collection.setId ?? collection.set_id
    const numForBuild = collection.cardNumber ?? collection.number
    const builtWhenOnCdn = getPokemonTcgImageUrlFromSetNumberIfOnCdn(setForBuild, numForBuild)
    const tcgImageUrl =
      cardImageUrl ||
      builtWhenOnCdn ||
      getPokemonTcgImageUrl(collection.cardId)
    const imageSource = tcgImageUrl
      ? { uri: tcgImageUrl }
      : collection.image
        ? { uri: collection.image }
        : CARD_PLACEHOLDER_IMAGE
    return {
      id: collection.id,
      name: collection.name,
      price: priceStr,
      ebayLastSoldZar: ebayZar ?? undefined,
      image: imageSource,
      isListed: collection.isListed || false,
      cardId: collection.cardId ?? undefined,
      set: collection.set ?? undefined,
      marketPriceUsd: primaryUsd ?? undefined,
      setName: setLabel,
      cardNumber: cardNumberLabel,
      metaLine,
      condition: collection.condition ?? undefined,
      finishLabel,
      quantity: 1,
      priceChangeZar,
      priceChangePercent,
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textColor}
          />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SettingsMain' as never)}
            activeOpacity={0.7}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textColor} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ProfileHeader
              userName={userName}
              isPremium={isPremium}
              portfolioValue={portfolioValueStr}
              stats={stats}
              portfolioData={portfolioData}
              portfolioDates={portfolioDates}
              level={userLevel}
              currentXP={currentXP}
              xpToNextLevel={xpToNextLevel}
              profileImage={user?.avatar ? { uri: user.avatar } : undefined}
              productsCount={user?.productsCount ?? 0}
              followersCount={user?.followersCount ?? 0}
              salesCount={user?.salesCount ?? 0}
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
          </View>
        </View>

        <View style={styles.contentWrapper}>
          {/* Section Header: title + "See all" subtext on left; Add Card + Verify on right inline with title */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <ThemedText style={styles.sectionTitle}>Your Portfolio</ThemedText>
            </View>
            <View style={styles.sectionHeaderActions}>
              <AppButton
                variant="outline"
                size="sm"
                icon="add"
                label="Add Card"
                onPress={() => setIsAddCardModalVisible(true)}
              />
              <AppButton
                variant="outline"
                size="sm"
                icon="lock-closed-outline"
                label="Verify"
                onPress={() => setIsBulkVaultingModalVisible(true)}
              />
            </View>
          </View>

          <View style={styles.productsBlock}>
            {loading ? (
              <>
                <View style={styles.skeletonLoadingLabel}>
                  <ActivityIndicator size="small" color={theme.textColor} />
                  <Text style={styles.skeletonLoadingText}>Loading your collection…</Text>
                </View>
                <View style={styles.statsPillContainer}>
                  <View style={styles.statsGrid}>
                    {[1, 2, 3, 4].map((i) => (
                      <View key={i} style={styles.statItem}>
                        <SkeletonBox width={32} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
                        <SkeletonBox width={36} height={10} borderRadius={4} />
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.skeletonCardsRow}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonCard}>
                      <SkeletonBox width="100%" height={96} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.xs }} />
                      <SkeletonBox width={60} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                      <SkeletonBox width="90%" height={12} borderRadius={4} />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.statsPillContainer}>
                  <Text style={styles.statInline}>
                    <Text style={styles.statInlineNum}>{stats.cards}</Text>
                    <Text style={styles.statInlineLabel}> Cards</Text>
                  </Text>
                  <Text style={styles.statDot}>·</Text>
                  <Text style={styles.statInline}>
                    <Text style={styles.statInlineNum}>{stats.sealed}</Text>
                    <Text style={styles.statInlineLabel}> Sealed</Text>
                  </Text>
                  <Text style={styles.statDot}>·</Text>
                  <Text style={styles.statInline}>
                    <Text style={styles.statInlineNum}>{stats.slabs}</Text>
                    <Text style={styles.statInlineLabel}> Slabs</Text>
                  </Text>
                  <Text style={styles.statDot}>·</Text>
                  <Text style={styles.statInline}>
                    <Text style={styles.statInlineNum}>{stats.total}</Text>
                    <Text style={styles.statInlineLabel}> Total</Text>
                  </Text>
                </View>
                {products.length > 0 ? (
              <ProductGrid
                products={products}
                onProductPress={(product) => {
                  if (product.image) {
                    const price = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0
                    const ebayPrice = (product as any).ebayLastSoldZar
                    const set = (product as any).set
                    navigation.navigate('Product', {
                      id: String(product.id),
                      cardId: (product as any).cardId,
                      name: product.name,
                      image: product.image,
                      category: 'product',
                      price: price,
                      ebayPrice: ebayPrice != null ? ebayPrice : undefined,
                      description: product.name,
                      set: set,
                      setName: (product as any).setName ?? set,
                      cardNumber: (product as any).cardNumber,
                      fromProfile: true,
                      isListed: product.isListed,
                      marketPriceUsd: (product as any).marketPriceUsd,
                    })
                  }
                }}
                onQuickListPress={(product) => {
                  if (!product.isListed) {
                    const usd = (product as any).marketPriceUsd
                    const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17
                    const minPriceFromMarketZar =
                      usd != null && Number(usd) > 0 ? Math.round(0.8 * Number(usd) * USD_TO_ZAR) : undefined
                    navigation.navigate('ListItem', {
                      collectionId: Number(product.id),
                      cardId: (product as any).cardId,
                      productName: product.name,
                      productImage: product.image,
                      minPriceFromMarketZar,
                    })
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
              </>
            )}
          </View>

        </View>
      </ScrollView>

      {/* List flow moved to ListItem screen */}

      {/* Add Card Modal */}
      <AddCardModal
        visible={isAddCardModalVisible}
        onClose={() => setIsAddCardModalVisible(false)}
        onAdd={async (data) => {
          const res = await addCardToCollection(data)
          if (res?.vaultedRequestId != null && user) {
            const nameParts = (user.name || 'User').trim().split(' ')
            setVerifyBuyer({
              id: user.id,
              email: user.email || '',
              firstName: user.firstName ?? nameParts[0] ?? 'User',
              lastName: user.lastName ?? nameParts.slice(1).join(' ') ?? '',
            })
            setVerifyPudoLocker(user.pudoLockerCode ?? '')
            setVerifyPudoAddress(user.pudoAddress ?? '')
            setVerifyVaultedRequestIds([res.vaultedRequestId])
            setIsAddCardModalVisible(false)
            setIsVerifyPaymentVisible(true)
          }
        }}
        apiBaseUrl={DOMAIN}
      />

      {/* Bulk Verification Modal */}
      <BulkVaultingModal
        visible={isBulkVaultingModalVisible}
        collections={collections.map((c) => ({
          id: c.id,
          name: c.name,
          image: c.cardImageUrl || c.image || undefined,
          set: c.set || undefined,
          cardNumber:
            c.cardNumber != null && String(c.cardNumber).trim() !== ''
              ? String(c.cardNumber).trim()
              : c.number != null && String(c.number).trim() !== ''
                ? String(c.number).trim()
                : undefined,
          type: c.type,
        }))}
        onClose={() => setIsBulkVaultingModalVisible(false)}
        onRequestVaulting={requestBulkVaulting}
      />

      {/* Verify (R100) payment – after bulk vault or add card with request verification */}
      <PayFastPayment
        visible={isVerifyPaymentVisible}
        amount={100}
        itemName={verifyVaultedRequestIds.length > 1 ? `Verification fee (${verifyVaultedRequestIds.length} cards)` : 'Verification fee (1 card)'}
        paymentType="verify"
        vaultedRequestIds={verifyVaultedRequestIds}
        userEmail={verifyBuyer?.email}
        userNameFirst={verifyBuyer?.firstName}
        userNameLast={verifyBuyer?.lastName}
        buyerId={verifyBuyer?.id}
        initialPudoLockerCode={verifyPudoLocker}
        initialShippingAddress={verifyPudoAddress}
        onClose={() => {
          setIsVerifyPaymentVisible(false)
          setVerifyVaultedRequestIds([])
          setVerifyBuyer(null)
          setVerifyPudoLocker('')
          setVerifyPudoAddress('')
        }}
        onSuccess={() => {
          setIsVerifyPaymentVisible(false)
          setVerifyVaultedRequestIds([])
          setVerifyBuyer(null)
          setVerifyPudoLocker('')
          setVerifyPudoAddress('')
          fetchCollections()
        }}
        onCancel={() => {
          setIsVerifyPaymentVisible(false)
          setVerifyVaultedRequestIds([])
          setVerifyBuyer(null)
        }}
        onError={(err) => {
          console.error('Verify payment error:', err)
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
  headerRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingHorizontal: SPACING.containerPadding,
  },
  settingsButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.containerPadding,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  scrollContentContainer: {
    paddingBottom: SPACING.screenBottom,
  },
  contentWrapper: {
    backgroundColor: theme.backgroundColor,
    paddingHorizontal: SPACING.containerPadding,
    marginTop: SPACING.xs,
  },
  productsBlock: {
    marginTop: 0,
  },
  statsPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  statInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statInlineNum: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  statInlineLabel: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statDot: {
    fontSize: TYPOGRAPHY.label,
    color: 'rgba(255, 255, 255, 0.25)',
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
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  skeletonCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skeletonCard: {
    width: '31%',
    minWidth: 0,
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
  emptyContainer: {
    padding: SPACING.lg,
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
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    marginTop: 0,
    gap: SPACING.sm,
  },
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h4,
    lineHeight: Math.round(TYPOGRAPHY.h4 * 1.15),
    fontFamily: theme.boldFont,
    color: theme.textColor,
    letterSpacing: 0.1,
    ...(isAndroid ? { includeFontPadding: false } : {}),
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 0,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.1,
  },
})
