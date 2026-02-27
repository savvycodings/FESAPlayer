import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, FlatList } from 'react-native'
import { useContext, useState, useEffect, useMemo, useRef } from 'react'
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

const CONDITION_OPTIONS = ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'] as const
// USD to ZAR for displaying API prices in South African Rand (override via env if needed)
const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 16

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
  const lookupRef = useRef<() => Promise<void>>(() => Promise.resolve())

  // Auto-search when user has name + (set or card number); no button click needed
  useEffect(() => {
    if (!visible || !apiBaseUrl) return
    const hasName = name.trim().length >= 2
    const hasSetOrNumber = set.trim().length > 0 || cardNumber.trim().length > 0
    if (!hasName || !hasSetOrNumber) return
    lookupRef.current = handleLookupCard
    const t = setTimeout(() => lookupRef.current(), 600)
    return () => clearTimeout(t)
  }, [name, set, cardNumber, visible, apiBaseUrl])

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
    }
  }, [visible])

  const isValid = () => {
    return name.trim().length > 0
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7, // Lower quality for smaller file size
      aspect: [1, 1],
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      
      // Check file size (if available)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { // 5MB limit
        Alert.alert(
          'Image Too Large',
          'The selected image is too large (over 5MB). Please choose a smaller image or compress it.',
          [
            { text: 'OK', onPress: () => {} }
          ]
        )
        return
      }
      
      // Check file size by reading file info
      try {
        if (asset.uri && !asset.uri.startsWith('blob:')) {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri)
          if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
            Alert.alert(
              'Image Too Large',
              'The selected image is too large (over 5MB). Please choose a smaller image.',
              [
                { text: 'OK', onPress: () => {} }
              ]
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
      // Price lookup does not touch the card image; image is driven only by set + number (built URL) or a separate image API.
    } catch (e) {
      setCardInfo(null)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add to Collection</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
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
              <Text style={styles.inputLabel}>Name *</Text>
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
                  placeholder="e.g., 284 (set number on the card)"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="default"
                />
              </View>
            )}

            {/* Set: dropdown from TCG sets */}
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

            {/* Set picker modal */}
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

            {/* Image: built only from set + card number (independent of price lookup). Image in DB is set by the image API only. */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Image</Text>
              {type === 'card' ? (
                (() => {
                  const displayUri = getPokemonTcgImageUrlFromSetNumberIfOnCdn(set, cardNumber)
                  if (!displayUri) {
                    return (
                      <View style={styles.cardImageBox}>
                        <Text style={styles.noImageText}>No img found</Text>
                      </View>
                    )
                  }
                  return (
                    <View style={styles.cardImageBox}>
                      <Image
                        source={{ uri: displayUri }}
                        style={styles.cardImage}
                        resizeMode="contain"
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

            {/* Link to Pokedata: search runs automatically when you enter name + set or number */}
            {type === 'card' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Link to Pokedata (optional)</Text>
                {lookupLoading && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
                    <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                    <Text style={[styles.inputLabel, { marginLeft: SPACING.sm, fontWeight: '400', opacity: 0.9 }]}>Looking up card…</Text>
                  </View>
                )}
                {lookupResults.length > 0 && (
                  <View style={styles.lookupResults}>
                    <Text style={styles.inputLabel}>Tap to select (match # to your card)</Text>
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
                        <Text style={styles.lookupRowId}>ID: {item.id}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {cardId && (
                  <View style={[styles.cardInfoBox, { borderColor: theme.tintColor || '#73EC8B' }]}>
                    <Text style={styles.cardInfoTitle}>Linked: Pokedata ID {cardId}{cardNumber ? ` · #${cardNumber}` : ''}</Text>
                    {cardInfo && (
                      <Text style={styles.cardInfoText}>
                        Market {cardInfo.marketPrice != null ? formatZar(usdToZar(cardInfo.marketPrice)) : '—'} · eBay: {cardInfo.ebayLastSold != null ? formatZar(usdToZar(cardInfo.ebayLastSold)) : '—'}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Condition – tap to select */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Condition</Text>
              <View style={styles.conditionRow}>
                {CONDITION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.conditionChip, condition === opt && styles.conditionChipActive]}
                    onPress={() => setCondition(condition === opt ? '' : opt)}
                  >
                    <Text style={[styles.conditionChipText, condition === opt && styles.conditionChipTextActive]} numberOfLines={1}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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

            {/* Description */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Additional details..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Personal notes..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Request Vaulting Option */}
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
                  <Text style={styles.vaultingLabel}>Request Vaulting</Text>
                  <Text style={styles.vaultingDescription}>
                    Send this card to our vault for safe storage and verification before selling
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Upload Success */}
          {uploadSuccess && (
            <View style={[styles.errorContainer, { backgroundColor: 'rgba(115, 236, 139, 0.2)', borderColor: '#73EC8B' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#73EC8B" />
              <Text style={[styles.errorText, { color: '#73EC8B' }]}>Card added successfully!</Text>
            </View>
          )}
          
          {/* Upload Error */}
          {uploadError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{uploadError}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleClose}
              disabled={isUploading}
            >
              <Text style={styles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
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
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: theme.cardBackground || '#1a1a1a',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
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
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  conditionChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  conditionChipActive: {
    backgroundColor: theme.tintColor || '#73EC8B',
    borderColor: theme.tintColor || '#73EC8B',
  },
  conditionChipText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
    maxWidth: 120,
  },
  conditionChipTextActive: {
    color: '#000',
    fontFamily: theme.semiBoldFont,
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
  cardInfoBox: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardInfoTitle: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: SPACING.xs,
  },
  cardInfoText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardImageBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  cardImage: {
    width: '100%',
    height: 200,
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
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    flex: 1,
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
