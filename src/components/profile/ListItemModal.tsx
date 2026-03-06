import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native'
import { useContext, useState, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface ListItemModalProps {
  visible: boolean
  productName: string
  productImage?: any
  onClose: () => void
  /** Called with price and the selected listing photo URI (required for new listings; omitted when editing). Can return a Promise so the modal waits and shows loading. */
  onList: (price: number, listingImageUri?: string, listingPhotos?: { front: string; back: string; close: string }) => void | Promise<void>
  initialPrice?: number
  initialDescription?: string
  /** When set, shows a "Remove listing" button at the bottom (for your store edit only). */
  onRemoveListing?: () => void | Promise<void>
  /** Minimum listing price (ZAR) = 80% of market price (from Pokedata/card_prices, converted to ZAR). When set, user cannot list below this. */
  minPriceFromMarketZar?: number
  /** @deprecated Use minPriceFromMarketZar. When set without minPriceFromMarketZar, used for validation (assumes price in USD). */
  minPriceFromMarketUsd?: number
}

export function ListItemModal({
  visible,
  productName,
  productImage,
  onClose,
  onList,
  initialPrice,
  initialDescription,
  onRemoveListing,
  minPriceFromMarketZar,
  minPriceFromMarketUsd,
}: ListItemModalProps) {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [frontUri, setFrontUri] = useState<string | null>(null)
  const [backUri, setBackUri] = useState<string | null>(null)
  const [closeUri, setCloseUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = initialPrice !== undefined

  // Update fields when modal opens with initial values (for editing)
  useEffect(() => {
    if (visible) {
      if (initialPrice !== undefined) {
        setPrice(initialPrice.toString())
      } else {
        setPrice('')
      }
      if (initialDescription) {
        setDescription(initialDescription)
      } else {
        setDescription('')
      }
      if (!isEditing) {
        setFrontUri(null)
        setBackUri(null)
        setCloseUri(null)
      }
    }
  }, [visible, initialPrice, initialDescription, isEditing])

  const minZar = minPriceFromMarketZar ?? (minPriceFromMarketUsd != null && minPriceFromMarketUsd > 0 ? minPriceFromMarketUsd * (Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17) : undefined)
  const hasRequiredImages = isEditing || (!!frontUri && !!backUri && !!closeUri)
  const isValid = () => {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''))
    if (numericPrice <= 0 || description.trim().length === 0 || !hasRequiredImages) return false
    if (minZar != null && minZar > 0 && numericPrice < minZar) return false
    return true
  }

  const setSlotFromUri = (slot: 'front' | 'back' | 'close', uri: string) => {
    if (slot === 'front') setFrontUri(uri)
    else if (slot === 'back') setBackUri(uri)
    else setCloseUri(uri)
  }

  const pickImage = (slot: 'front' | 'back' | 'close') => () => {
    const aspect: [number, number] = slot === 'close' ? [1, 1] : [3, 4]
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect,
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
              Alert.alert('Permission needed', 'Camera access is required to take listing photos.')
              return
            }
            const result = await ImagePicker.launchCameraAsync(options)
            if (!result.canceled && result.assets[0]) setSlotFromUri(slot, result.assets[0].uri)
          },
        },
        {
          text: 'Choose from library',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Photo library access is required to add listing photos.')
              return
            }
            const result = await ImagePicker.launchImageLibraryAsync(options)
            if (!result.canceled && result.assets[0]) setSlotFromUri(slot, result.assets[0].uri)
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleList = async () => {
    if (!isValid() || submitting) return
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''))
    if (minZar != null && minZar > 0 && numericPrice < minZar) {
      Alert.alert(
        'Price too low',
        `Listing price cannot be below 80% of market value. Minimum: R${minZar.toFixed(2)}`
      )
      return
    }
    setSubmitting(true)
    try {
      const primaryUri = frontUri ?? undefined
      const listingPhotos = frontUri && backUri && closeUri ? { front: frontUri, back: backUri, close: closeUri } : undefined
      await Promise.resolve(onList(numericPrice, primaryUri, listingPhotos))
      setPrice('')
      setDescription('')
      setFrontUri(null)
      setBackUri(null)
      setCloseUri(null)
      onClose()
    } catch (e) {
      // Error already shown by parent (e.g. Alert)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setPrice('')
    setDescription('')
    setFrontUri(null)
    setBackUri(null)
    setCloseUri(null)
    onClose()
  }

  const handleRemoveListing = () => {
    Alert.alert(
      'Remove listing',
      'Are you sure you want to remove this listing from your store?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveListing?.()
              handleClose()
            } catch {
              // Error already shown by parent; keep modal open
            }
          },
        },
      ]
    )
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
          <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.sm) + SPACING.lg }]}>
            <Text style={styles.title}>{isEditing ? 'Edit Listing' : 'List Your Item'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {/* Product Preview - TCG card portrait aspect (e.g. 63x88mm ≈ 0.72) */}
            {productImage && (
              <View style={styles.productPreview}>
                <Image
                  source={productImage}
                  style={styles.productImage}
                  resizeMode="contain"
                />
                <Text style={styles.productName} numberOfLines={2}>
                  {productName}
                </Text>
              </View>
            )}

            {/* 3 listing photos - bento: Front | Back, then Up close / Damage */}
            {!isEditing && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Listing photos (all 3 required)</Text>
                <Text style={styles.inputHint}>
                  Add clear photos of your physical card: front, back, and a close-up (or any damage).
                </Text>
                <View style={styles.bentoRow}>
                  <TouchableOpacity style={styles.bentoBox} onPress={pickImage('front')} activeOpacity={0.8}>
                    {frontUri ? (
                      <Image source={{ uri: frontUri }} style={styles.bentoImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.bentoPlaceholder}>
                        <Ionicons name="card-outline" size={28} color="rgba(255, 255, 255, 0.5)" />
                        <Text style={styles.bentoLabel}>Front</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bentoBox} onPress={pickImage('back')} activeOpacity={0.8}>
                    {backUri ? (
                      <Image source={{ uri: backUri }} style={styles.bentoImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.bentoPlaceholder}>
                        <Ionicons name="card-outline" size={28} color="rgba(255, 255, 255, 0.5)" />
                        <Text style={styles.bentoLabel}>Back</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.bentoWide} onPress={pickImage('close')} activeOpacity={0.8}>
                  {closeUri ? (
                    <Image source={{ uri: closeUri }} style={styles.bentoImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.bentoPlaceholder}>
                      <Ionicons name="scan-outline" size={28} color="rgba(255, 255, 255, 0.5)" />
                      <Text style={styles.bentoLabel}>Up close / Damage</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {(!frontUri || !backUri || !closeUri) && (
                  <Text style={styles.requiredBadge}>All 3 photos required to list</Text>
                )}
              </View>
            )}

            {/* Price Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Set Your Price</Text>
              {minZar != null && minZar > 0 && (
                <Text style={styles.inputHint}>
                  Minimum 80% of market: R{minZar.toFixed(2)}
                </Text>
              )}
              <View style={styles.priceInputContainer}>
                <View style={styles.currencySignContainer}>
                  <Text style={styles.currencySign}>R</Text>
                </View>
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
            </View>

            {/* Description Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Item Description</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your item..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Footer Button */}
            <TouchableOpacity
              style={[styles.listButton, (!isValid() || submitting) && styles.listButtonDisabled]}
              onPress={handleList}
              activeOpacity={0.8}
              disabled={!isValid() || submitting}
            >
              {submitting ? (
                <View style={styles.listButtonContent}>
                  <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
                  <Text style={styles.listButtonText}>{isEditing ? 'Saving…' : 'Listing…'}</Text>
                </View>
              ) : (
                <Text style={styles.listButtonText}>{isEditing ? 'Save Changes' : 'List Item'}</Text>
              )}
            </TouchableOpacity>

            {/* Remove listing (only when editing your own store) */}
            {isEditing && onRemoveListing && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveListing}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={20} color={theme.destructiveColor || '#ef4444'} />
                <Text style={styles.removeButtonText}>Remove listing</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
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
      backgroundColor: theme.backgroundColor,
      borderRadius: RADIUS.lg,
      width: '90%',
      maxWidth: 420,
      maxHeight: '90%',
      padding: SPACING.containerPadding,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: SPACING.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: TYPOGRAPHY.h2,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
      flex: 1,
    },
    closeButton: {
      padding: SPACING.xs,
      marginLeft: SPACING.sm,
    },
    productPreview: {
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    productImage: {
      width: 100,
      aspectRatio: 63 / 88,
      maxHeight: 140,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.sm,
      backgroundColor: theme.cardBackground || '#000000',
    },
    productName: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      textAlign: 'center',
    },
    inputSection: {
      marginBottom: SPACING.lg,
    },
    inputLabel: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: SPACING.xs,
    },
    inputHint: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
      marginBottom: SPACING.sm,
    },
    bentoRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    bentoBox: {
      flex: 1,
      aspectRatio: 3 / 4,
      maxHeight: 120,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground || '#000000',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    bentoWide: {
      width: '100%',
      aspectRatio: 2,
      maxHeight: 100,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground || '#000000',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      marginBottom: SPACING.xs,
    },
    bentoImage: {
      width: '100%',
      height: '100%',
    },
    bentoPlaceholder: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bentoLabel: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.semiBoldFont,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: SPACING.xs,
    },
    requiredBadge: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.semiBoldFont,
      color: theme.tintColor || '#73EC8B',
      marginTop: SPACING.xs,
    },
    priceInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
    },
    currencySignContainer: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    currencySign: {
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
    },
    priceInput: {
      flex: 1,
      fontSize: TYPOGRAPHY.h2,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontWeight: '600',
    },
    descriptionInput: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: SPACING.md,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      minHeight: 88,
      maxHeight: 120,
    },
    listButton: {
      backgroundColor: theme.tintColor || '#73EC8B',
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.lg,
    },
    listButtonDisabled: {
      backgroundColor: 'rgba(115, 236, 139, 0.3)',
      opacity: 0.5,
    },
    listButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
    },
    listButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: '#000000',
      fontWeight: '600',
    },
    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.md,
      marginTop: SPACING.lg,
      borderWidth: 1,
      borderColor: theme.destructiveColor || 'rgba(239, 68, 68, 0.5)',
      borderRadius: RADIUS.md,
    },
    removeButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.destructiveColor || '#ef4444',
      fontWeight: '600',
    },
  })
