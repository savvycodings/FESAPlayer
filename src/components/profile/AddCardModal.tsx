import { View, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, FlatList } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useContext, useState, useEffect, useMemo, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { getPokemonTcgImageUrlFromSetNumber, getPokemonTcgImageUrlFromSetNumberIfOnCdn } from '../../utils/pokemonTcgImages'

let TCG_SETS: { id: string; name: string }[] = []
try {
  const data = require('../../utils/pokemonTcgSets.json') as { sets?: { id: string; name: string }[] }
  TCG_SETS = Array.isArray(data.sets) ? data.sets : []
} catch {
  TCG_SETS = []
}

const CONDITION_OPTIONS = ['Mint', 'Near Mint', 'LP', 'MP', 'HP', 'Damaged'] as const
/** Hide Set dropdown in UI (set is still used for image search/lookup). Set true to show again. */
const SHOW_SET_IN_UI = false
// USD to ZAR for displaying API prices in South African Rand (override via env if needed)
const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

interface AddCardModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (data: {
    type: 'card' | 'sealed' | 'slab'
    name: string
    description?: string
    image?: string
    cardId?: string
    set?: string
    condition?: string
    grade?: number
    purchaseDate?: string
    notes?: string
    requestVaulting?: boolean
  }) => Promise<void>
  apiBaseUrl?: string
}

export function AddCardModal({
  visible,
  onClose,
  onAdd,
  apiBaseUrl,
}: AddCardModalProps) {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const [type, setType] = useState<'card' | 'sealed' | 'slab'>('card')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | undefined>(undefined)
  const [set, setSet] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [condition, setCondition] = useState('')
  const [grade, setGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [requestVaulting, setRequestVaulting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [cardId, setCardId] = useState<string | null>(null)
  const [lookupResults, setLookupResults] = useState<{ id: string; name: string; set?: string; number?: string }[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [cardInfo, setCardInfo] = useState<{ marketPrice?: number; ebayLastSold?: number; currency?: string } | null>(null)
  const [setPickerVisible, setSetPickerVisible] = useState(false)
  const [setSearch, setSetSearch] = useState('')
  const [conditionAccordionOpen, setConditionAccordionOpen] = useState(false)
  const lookupRef = useRef<() => Promise<void>>(() => Promise.resolve())

  // Auto-search for market price and image only after name, card number (3+ digits), and condition are set.
  useEffect(() => {
    if (!visible || !apiBaseUrl || type !== 'card') return
    const hasName = name.trim().length >= 2
    const hasSetOrNumber = set.trim().length > 0 || cardNumber.trim().length >= 3
    const hasCondition = condition.trim().length > 0
    if (!hasName || !hasSetOrNumber || !hasCondition) return
    lookupRef.current = handleLookupCard
    const t = setTimeout(() => lookupRef.current(), 600)
    return () => clearTimeout(t)
  }, [name, set, cardNumber, condition, type, visible, apiBaseUrl])

  const filteredSets = useMemo(() => {
    if (!setSearch.trim()) return TCG_SETS
    const q = setSearch.toLowerCase().trim()
    return TCG_SETS.filter((s) => s.name.toLowerCase().includes(q))
  }, [setSearch])

  useEffect(() => {
    if (visible) {
      setType('card')
      setName('')
      setDescription('')
      setImage(undefined)
      setSet('')
      setCardNumber('')
      setCondition('')
      setUploadError(null)
      setUploadSuccess(false)
      setGrade('')
      setNotes('')
      setRequestVaulting(false)
      setCardId(null)
      setLookupResults([])
      setCardInfo(null)
      setConditionAccordionOpen(false)
    }
  }, [visible])

  const isValid = () => {
    if (name.trim().length === 0) return false
    if (type === 'card') return condition.trim().length > 0
    return true
  }

  const applyPickedAsset = async (asset: { uri: string; fileSize?: number }) => {
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert(
        'Image Too Large',
        'The image is too large (over 5MB). Please choose a smaller image or compress it.',
        [{ text: 'OK' }]
      )
      return
    }
    try {
      if (asset.uri && !asset.uri.startsWith('blob:')) {
        const fileInfo = await FileSystem.getInfoAsync(asset.uri)
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert(
            'Image Too Large',
            'The image is too large (over 5MB). Please choose a smaller image.',
            [{ text: 'OK' }]
          )
          return
        }
      }
    } catch (error) {
      console.log('Could not check file size:', error)
    }
    setImage(asset.uri)
    setUploadError(null)
  }

  const handlePickImage = () => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1],
    }
    Alert.alert(
      'Add photo',
      'Take a new photo or choose from your library.',
      [
        {
          text: 'Take photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera access is required to take a photo.')
              return
            }
            const result = await ImagePicker.launchCameraAsync(options)
            if (!result.canceled && result.assets[0]) await applyPickedAsset(result.assets[0])
          },
        },
        {
          text: 'Choose from library',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Photo library access is required.')
              return
            }
            const result = await ImagePicker.launchImageLibraryAsync(options)
            if (!result.canceled && result.assets[0]) await applyPickedAsset(result.assets[0])
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleAdd = async () => {
    if (!isValid()) return
    
    setIsUploading(true)
    setUploadError(null)
    
    try {
      // If there's an image, validate file size first
      if (image) {
        const isExternal = image.startsWith('http://') || image.startsWith('https://')
        
        if (!isExternal) {
          // Validate file size before upload (only for file:// URLs, blob URLs are already processed)
          if (image.startsWith('file://')) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(image)
              if (fileInfo.exists && fileInfo.size) {
                // Warn if file is too large (5MB limit for base64 encoding)
                // Base64 increases size by ~33%, so 5MB file becomes ~6.7MB base64
                if (fileInfo.size > 3.5 * 1024 * 1024) { // ~3.5MB limit
                  setUploadError(`Image is too large (${(fileInfo.size / 1024 / 1024).toFixed(2)}MB). Please choose a smaller image (under 3.5MB).`)
                  setIsUploading(false)
                  return
                }
              }
            } catch (error) {
              console.log('Could not check file size:', error)
              // Continue anyway - let the upload try
            }
          }
          // For blob URLs, we can't easily check size, so we'll let the upload try
        }
      }
      
      // For cards, save TCG image URL (set + number) from our API set list so profile shows correct artwork (e.g. images.pokemontcg.io/zsv10pt5/172_hires.png)
      const cardTcgImage = type === 'card' ? getPokemonTcgImageUrlFromSetNumber(set.trim(), cardNumber.trim()) : null
      const imageToSend = (type === 'card' && cardTcgImage) ? cardTcgImage : (image || undefined)

      // Call onAdd (which will handle upload) - modal stays open during upload
      await onAdd({
        type,
        name: name.trim(),
        description: description.trim() || undefined,
        image: imageToSend,
        cardId: cardId || undefined,
        set: set.trim() || undefined,
        cardNumber: cardNumber.trim() || undefined,
        condition: condition.trim() || undefined,
        grade: grade ? parseInt(grade) : undefined,
        notes: notes.trim() || undefined,
        requestVaulting: requestVaulting,
      })
      
      // Success — close immediately so profile page shows (no second popup)
      setIsUploading(false)
      setUploadError(null)
      setUploadSuccess(true)
      handleClose()
    } catch (error: any) {
      console.error('Error adding card:', error)
      setUploadError(error.message || 'Failed to add card. Please try again.')
      setUploadSuccess(false)
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSetPickerVisible(false)
    setSetSearch('')
    onClose()
    // Don't reset form state here — it causes a flash of empty form before the modal unmounts.
    // Reset happens in useEffect when visible becomes true (next time modal opens).
  }

  const hasUnsavedProgress = () =>
    name.trim().length > 0 ||
    cardNumber.trim().length > 0 ||
    set.trim().length > 0 ||
    condition.trim().length > 0 ||
    description.trim().length > 0 ||
    notes.trim().length > 0 ||
    grade.trim().length > 0 ||
    Boolean(image) ||
    Boolean(cardId)

  const requestClose = () => {
    if (setPickerVisible) {
      setSetPickerVisible(false)
      setSetSearch('')
      return
    }
    if (!hasUnsavedProgress()) {
      handleClose()
      return
    }
    Alert.alert(
      'Discard this card?',
      'Going back will clear what you have entered.',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: handleClose },
      ],
    )
  }

  const usdToZar = (usd: number) => Math.round(usd * USD_TO_ZAR)
  const formatZar = (zar: number) => `R${zar.toLocaleString('en-ZA')}`

  const handleLookupCard = async () => {
    const query = [name.trim(), cardNumber.trim(), set.trim()].filter(Boolean).join(' ')
    if (!query) {
      return
    }
    if (!apiBaseUrl) {
      return
    }
    setLookupLoading(true)
    setLookupResults([])
    setCardId(null)
    setCardInfo(null)
    try {
      const base = apiBaseUrl.replace(/\/$/, '')
      const url = `${base}/pokedata/search?query=${encodeURIComponent(query)}&asset_type=CARD`
      const res = await fetch(url)
      const data = await res.json()
      const results = data.results || []
      if (results.length === 0) {
        Alert.alert('No results', `No cards found for "${query}". Try a different name or set.`)
      } else {
        const list = results.map((r: any) => ({
          id: String(r.id),
          name: r.name || '',
          set: r.set,
          number: r.number ?? r.num ?? undefined,
        }))
        const num = cardNumber.trim()
        if (num) {
          list.sort((a, b) => {
            const aMatch = a.number?.toLowerCase() === num.toLowerCase() ? 1 : 0
            const bMatch = b.number?.toLowerCase() === num.toLowerCase() ? 1 : 0
            return bMatch - aMatch
          })
        }
        setLookupResults(list)
        // Auto-apply first result so user doesn't have to tap (first is usually the one they want)
        await handleSelectLookupCard(list[0])
      }
    } catch (e: any) {
      Alert.alert('Lookup failed', e?.message || 'Could not search cards.')
    } finally {
      setLookupLoading(false)
    }
  }
  lookupRef.current = handleLookupCard

  const handleSelectLookupCard = async (item: { id: string; name: string; set?: string; number?: string }) => {
    setCardId(item.id)
    setName(item.name)
    // Only set Set field from search result if it looks like a full name (not a short code like "PRE")
    if (item.set && item.set.length > 6 && !/^[A-Z0-9]{2,5}$/i.test(item.set.trim())) setSet(item.set)
    if (item.number) setCardNumber(item.number)
    setLookupResults([])
    if (!apiBaseUrl) return
    try {
      const base = apiBaseUrl.replace(/\/$/, '')
      const res = await fetch(`${base}/pokedata/card/${encodeURIComponent(item.id)}?asset_type=CARD`)
      const data = await res.json()
      const market = data.marketPrice ?? undefined
      setCardInfo({
        marketPrice: market,
        ebayLastSold: data.ebayLastSold ?? undefined,
        currency: 'USD',
      })
      // Keep set as display name (e.g. "Prismatic Evolutions"), never overwrite with code (e.g. "PRE")
      if (data.setName != null || data.setId != null) setSet(String(data.setName ?? data.setId ?? ''))
      if (data.cardNumber != null) setCardNumber(String(data.cardNumber))
      if (data.imageUrl && String(data.imageUrl).startsWith('http')) {
        setImage(String(data.imageUrl))
      }
    } catch (e) {
      setCardInfo(null)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.sm) + SPACING.sm }]}>
          <TouchableOpacity
            onPress={requestClose}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            Add to Collection
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAwareScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={32}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          bounces={false}
        >
            {/* Type Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeSelector}>
                {(['card', 'sealed', 'slab'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeOption,
                      type === t && styles.typeOptionActive,
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      type === t && styles.typeOptionTextActive,
                    ]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Card info: Name, Card number, Set, then Image */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Mega Gengar ex"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoFocus
              />
            </View>
            {type === 'card' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Card number</Text>
                <TextInput
                  style={styles.textInput}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="e.g., 284"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="default"
                />
              </View>
            )}

            {/* Condition accordion for cards */}
            {type === 'card' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Condition</Text>
                <TouchableOpacity
                  style={[
                    styles.textInput,
                    styles.setSelectorButton,
                    conditionAccordionOpen && styles.accordionTriggerOpen,
                  ]}
                  onPress={() => setConditionAccordionOpen(!conditionAccordionOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={condition ? styles.setSelectorText : styles.setSelectorPlaceholder} numberOfLines={1}>
                    {condition || 'Select condition...'}
                  </Text>
                  <Ionicons
                    name={conditionAccordionOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </TouchableOpacity>
                {conditionAccordionOpen && (
                  <View style={styles.accordionBody}>
                    {CONDITION_OPTIONS.map((opt) => {
                      const isSelected = condition === opt
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.accordionItem, isSelected && styles.accordionItemActive]}
                          onPress={() => {
                            setCondition(opt)
                            setConditionAccordionOpen(false)
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.accordionItemText, isSelected && styles.accordionItemTextActive]}>
                            {opt}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.tintColor || '#73EC8B'} />
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Set: dropdown from TCG sets (hidden in UI; set state still used for image search/lookup) */}
            {SHOW_SET_IN_UI && (
              <>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Set</Text>
                  <TouchableOpacity
                    style={[styles.textInput, styles.setSelectorButton]}
                    onPress={() => setSetPickerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={set ? styles.setSelectorText : styles.setSelectorPlaceholder} numberOfLines={1}>
                      {set || 'Select set...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.5)" />
                  </TouchableOpacity>
                </View>
                <Modal visible={setPickerVisible} transparent animationType="slide">
                  <View style={styles.setPickerBackdrop}>
                    <TouchableOpacity
                      style={StyleSheet.absoluteFill}
                      activeOpacity={1}
                      onPress={() => { setSetPickerVisible(false); setSetSearch('') }}
                    />
                    <View style={styles.setPickerSheet}>
                      <View style={styles.setPickerHeader}>
                        <Text style={styles.setPickerTitle}>Select set</Text>
                        <TouchableOpacity onPress={() => { setSetPickerVisible(false); setSetSearch('') }} hitSlop={12}>
                          <Ionicons name="close" size={24} color={theme.textColor} />
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[styles.textInput, styles.setSearchInput]}
                        value={setSearch}
                        onChangeText={setSetSearch}
                        placeholder="Search sets..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      />
                      <FlatList
                        data={filteredSets}
                        keyExtractor={(item) => item.id}
                        style={styles.setPickerList}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[styles.setPickerItem, set === item.name && styles.setPickerItemActive]}
                            onPress={() => {
                              setSet(item.name)
                              setSetPickerVisible(false)
                              setSetSearch('')
                            }}
                          >
                            <Text style={styles.setPickerItemText} numberOfLines={1}>{item.name}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </View>
                </Modal>
              </>
            )}

            {/* Card preview — same proportions as Product screen (profile tap-through). */}
            <View style={styles.inputSection}>
              {type === 'card' ? (
                (() => {
                  const canShowImage = condition.trim().length > 0
                  if (!canShowImage) {
                    return (
                      <View style={[styles.cardImageHero, styles.cardImageHeroEmpty]}>
                        <Text style={styles.noImageText}>Select condition above to load card art</Text>
                      </View>
                    )
                  }
                  const builtUri = getPokemonTcgImageUrlFromSetNumberIfOnCdn(set, cardNumber)
                  const displayUri =
                    builtUri || (image && image.startsWith('http') ? image : null)
                  if (!displayUri) {
                    return (
                      <View style={[styles.cardImageHero, styles.cardImageHeroEmpty, styles.cardImageHeroInfo]}>
                        {cardInfo ? (
                          <View style={styles.cardInfoPrices}>
                            <View style={styles.cardInfoPriceRow}>
                              <View style={styles.cardInfoPriceLabelRow}>
                                <Ionicons name="trending-up-outline" size={18} color={theme.tintColor || '#73EC8B'} style={styles.cardInfoPriceIcon} />
                                <Text style={styles.cardInfoPriceLabel}>Market</Text>
                              </View>
                              <Text style={styles.cardInfoPriceValue}>
                                {cardInfo.marketPrice != null ? formatZar(usdToZar(cardInfo.marketPrice)) : '—'}
                              </Text>
                            </View>
                            <View style={[styles.cardInfoPriceRow, styles.cardInfoPriceRowLast]}>
                              <View style={styles.cardInfoPriceLabelRow}>
                                <Ionicons name="pricetag-outline" size={18} color={theme.tintColor || '#73EC8B'} style={styles.cardInfoPriceIcon} />
                                <Text style={styles.cardInfoPriceLabel}>eBay last sold</Text>
                              </View>
                              <Text style={styles.cardInfoPriceValue}>
                                {cardInfo.ebayLastSold != null ? formatZar(usdToZar(cardInfo.ebayLastSold)) : '—'}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.noImageText}>Searching for card art…</Text>
                        )}
                      </View>
                    )
                  }
                  return (
                    <View style={styles.cardImageHero}>
                      <Image
                        source={{ uri: displayUri }}
                        style={styles.cardImageFill}
                        resizeMode="cover"
                      />
                    </View>
                  )
                })()
              ) : (
                <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
                  {image ? (
                    <View style={styles.imagePreview}>
                      <Text style={styles.imagePreviewText}>Image selected</Text>
                      <Ionicons name="checkmark-circle" size={20} color={theme.tintColor || '#73EC8B'} />
                    </View>
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="image-outline" size={24} color="rgba(255, 255, 255, 0.5)" />
                      <Text style={styles.imagePickerText}>Pick an image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Market prices + lookup list (no title/box when matched) */}
            {type === 'card' && (
              <View style={styles.inputSection}>
                {!condition.trim() && (
                  <Text style={styles.searchingMarketHint}>Select condition above to search market prices</Text>
                )}
                {lookupLoading && (
                  <View style={styles.searchingMarketLoading}>
                    <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                    <Text style={styles.searchingMarketLoadingText}>Searching market…</Text>
                  </View>
                )}
                {lookupResults.length > 0 && (
                  <View style={[styles.lookupResults, styles.lookupResultsBox]}>
                    <Text style={styles.lookupResultsHint}>Tap to select (match # to your card)</Text>
                    {lookupResults.slice(0, 8).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.lookupRow}
                        onPress={() => handleSelectLookupCard(item)}
                      >
                        {item.number ? (
                          <View style={styles.lookupNumberBadge}>
                            <Text style={styles.lookupNumberBadgeText}>#{item.number}</Text>
                          </View>
                        ) : null}
                        <View style={styles.lookupRowMain}>
                          <Text style={styles.lookupRowText} numberOfLines={1}>{item.name}</Text>
                          {item.set ? <Text style={styles.lookupRowSet} numberOfLines={1}>{item.set}</Text> : null}
                        </View>
                        <Text style={styles.lookupRowId}>{item.id}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {cardId && cardInfo && (
                  <View style={styles.cardInfoPrices}>
                    <View style={styles.cardInfoPriceRow}>
                      <View style={styles.cardInfoPriceLabelRow}>
                        <Ionicons name="trending-up-outline" size={18} color={theme.tintColor || '#73EC8B'} style={styles.cardInfoPriceIcon} />
                        <Text style={styles.cardInfoPriceLabel}>Market</Text>
                      </View>
                      <Text style={styles.cardInfoPriceValue}>
                        {cardInfo.marketPrice != null ? formatZar(usdToZar(cardInfo.marketPrice)) : '—'}
                      </Text>
                    </View>
                    <View style={[styles.cardInfoPriceRow, styles.cardInfoPriceRowLast]}>
                      <View style={styles.cardInfoPriceLabelRow}>
                        <Ionicons name="pricetag-outline" size={18} color={theme.tintColor || '#73EC8B'} style={styles.cardInfoPriceIcon} />
                        <Text style={styles.cardInfoPriceLabel}>eBay last sold</Text>
                      </View>
                      <Text style={styles.cardInfoPriceValue}>
                        {cardInfo.ebayLastSold != null ? formatZar(usdToZar(cardInfo.ebayLastSold)) : '—'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Condition accordion for sealed/slab */}
            {type !== 'card' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Condition</Text>
                <TouchableOpacity
                  style={[
                    styles.textInput,
                    styles.setSelectorButton,
                    conditionAccordionOpen && styles.accordionTriggerOpen,
                  ]}
                  onPress={() => setConditionAccordionOpen(!conditionAccordionOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={condition ? styles.setSelectorText : styles.setSelectorPlaceholder} numberOfLines={1}>
                    {condition || 'Select condition...'}
                  </Text>
                  <Ionicons
                    name={conditionAccordionOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </TouchableOpacity>
                {conditionAccordionOpen && (
                  <View style={styles.accordionBody}>
                    {CONDITION_OPTIONS.map((opt) => {
                      const isSelected = condition === opt
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.accordionItem, isSelected && styles.accordionItemActive]}
                          onPress={() => {
                            setCondition(opt)
                            setConditionAccordionOpen(false)
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.accordionItemText, isSelected && styles.accordionItemTextActive]}>
                            {opt}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.tintColor || '#73EC8B'} />
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Grade Input (for slabs) */}
            {type === 'slab' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Grade</Text>
                <TextInput
                  style={styles.textInput}
                  value={grade}
                  onChangeText={setGrade}
                  placeholder="e.g., 10"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Request Verification Option */}
            <View style={styles.inputSection}>
              <TouchableOpacity
                style={styles.vaultingOption}
                onPress={() => setRequestVaulting(!requestVaulting)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, requestVaulting && styles.checkboxChecked]}>
                  {requestVaulting && (
                    <Ionicons name="checkmark" size={16} color="#000" />
                  )}
                </View>
                <View style={styles.vaultingTextContainer}>
                  <Text style={styles.vaultingLabel}>Request Verification</Text>
                  <Text style={styles.vaultingDescription}>
                    Send your card in so we can verify you have it. Buyers get protection on high-value cards.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>

        {uploadSuccess && (
          <View style={[styles.errorContainer, styles.footerMessage, { backgroundColor: 'rgba(115, 236, 139, 0.2)', borderColor: '#73EC8B' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#73EC8B" />
            <Text style={[styles.errorText, { color: '#73EC8B' }]}>Card added successfully!</Text>
          </View>
        )}

        {uploadError && (
          <View style={[styles.errorContainer, styles.footerMessage]}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{uploadError}</Text>
          </View>
        )}

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, (!isValid() || isUploading) && styles.buttonDisabled]}
            onPress={handleAdd}
            disabled={!isValid() || isUploading}
          >
            {isUploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={[styles.buttonTextPrimary, { marginLeft: SPACING.xs }]}>Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.buttonTextPrimary}>Add Card</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.backgroundColor || theme.cardBackground || '#0c0f14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -SPACING.xs,
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  footerMessage: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  inputSection: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  setSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setSelectorText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    flex: 1,
    marginRight: SPACING.sm,
  },
  setSelectorPlaceholder: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
    marginRight: SPACING.sm,
  },
  setPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  setPickerSheet: {
    maxHeight: '70%',
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    backgroundColor: theme.backgroundColor,
    paddingBottom: SPACING.lg,
  },
  setPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setPickerTitle: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
  },
  setSearchInput: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  setPickerList: {
    maxHeight: 320,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  setPickerItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  setPickerItemActive: {
    backgroundColor: 'rgba(115, 236, 139, 0.15)',
    borderColor: theme.tintColor || '#73EC8B',
  },
  setPickerItemText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeOption: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: theme.tintColor || '#73EC8B',
    borderColor: theme.tintColor || '#73EC8B',
  },
  typeOptionText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: '#000',
  },
  accordionTriggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  accordionBody: {
    marginTop: -1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: SPACING.xs,
  },
  accordionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  accordionItemActive: {
    backgroundColor: 'rgba(115, 236, 139, 0.12)',
    borderColor: 'rgba(115, 236, 139, 0.4)',
  },
  accordionItemText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
  },
  accordionItemTextActive: {
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  lookupResults: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: SPACING.sm,
  },
  lookupNumberBadge: {
    backgroundColor: theme.tintColor || '#73EC8B',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  lookupNumberBadgeText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: '#000',
  },
  lookupRowMain: {
    flex: 1,
    minWidth: 0,
  },
  lookupRowText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
  },
  lookupRowSet: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  lookupRowId: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  searchingMarketHint: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.md,
  },
  searchingMarketLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
  },
  searchingMarketLoadingText: {
    marginLeft: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  lookupResultsBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: SPACING.sm,
  },
  lookupResultsHint: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.sm,
  },
  cardInfoPrices: {
    gap: 0,
    marginTop: SPACING.xs,
  },
  cardInfoPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardInfoPriceRowLast: {
    borderBottomWidth: 0,
  },
  cardInfoPriceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfoPriceIcon: {
    marginRight: SPACING.sm,
  },
  cardInfoPriceLabel: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardInfoPriceValue: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  cardInfoText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  /** Matches Product screen imageContainer (2.5 × 3.5 card ratio). */
  cardImageHero: {
    width: '100%',
    aspectRatio: 2.5 / 3.5,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.04)',
  },
  cardImageHeroEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  cardImageHeroInfo: {
    aspectRatio: undefined,
    minHeight: 120,
    padding: SPACING.lg,
  },
  cardImageFill: {
    width: '100%',
    height: '100%',
  },
  noImageText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  imagePickerButton: {
    marginTop: SPACING.xs,
  },
  imagePickerPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: SPACING.xs,
  },
  imagePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.tintColor || '#73EC8B',
  },
  imagePreviewText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
  },
  actions: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: theme.backgroundColor || theme.cardBackground || '#0c0f14',
  },
  button: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonPrimary: {
    backgroundColor: theme.tintColor || '#73EC8B',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextSecondary: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: '#000',
    fontWeight: '600',
  },
  vaultingOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.tintColor || '#73EC8B',
    borderColor: theme.tintColor || '#73EC8B',
  },
  vaultingTextContainer: {
    flex: 1,
  },
  vaultingLabel: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  vaultingDescription: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: '#EF4444',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
