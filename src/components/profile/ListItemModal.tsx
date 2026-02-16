import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native'
import { useContext, useState, useEffect } from 'react'
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
  /** Called with price and the selected listing photo URI (required for new listings; omitted when editing). */
  onList: (price: number, listingImageUri?: string) => void
  initialPrice?: number
  initialDescription?: string
  /** When set, shows a "Remove listing" button at the bottom (for your store edit only). */
  onRemoveListing?: () => void | Promise<void>
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
}: ListItemModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [listingImageUri, setListingImageUri] = useState<string | null>(null)

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
        setListingImageUri(null)
      }
    }
  }, [visible, initialPrice, initialDescription, isEditing])

  // Listing photo is required for new listings (store uses Cloudinary for listing images)
  const hasRequiredImage = isEditing || !!listingImageUri
  const isValid = () => {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''))
    return numericPrice > 0 && description.trim().length > 0 && hasRequiredImage
  }

  const handlePickListingImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to add a listing photo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1],
    })
    if (!result.canceled && result.assets[0]) {
      setListingImageUri(result.assets[0].uri)
    }
  }

  const handleList = () => {
    if (!isValid()) return
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''))
    onList(numericPrice, listingImageUri ?? undefined)
    setPrice('')
    setDescription('')
    setListingImageUri(null)
    onClose()
  }

  const handleClose = () => {
    setPrice('')
    setDescription('')
    setListingImageUri(null)
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
            await onRemoveListing?.()
            handleClose()
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
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Edit Listing' : 'List Your Item'}</Text>
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
            {/* Product Preview */}
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

            {/* Listing photo (required for new listings — stored in Cloudinary) */}
            {!isEditing && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Listing photo (required)</Text>
                <Text style={styles.inputHint}>
                  Add a photo of your physical card. This will be shown on your store.
                </Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handlePickListingImage}
                  activeOpacity={0.8}
                >
                  {listingImageUri ? (
                    <Image source={{ uri: listingImageUri }} style={styles.listingImagePreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="camera" size={32} color="rgba(255, 255, 255, 0.5)" />
                      <Text style={styles.imagePickerPlaceholderText}>Tap to select photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {!listingImageUri && (
                  <Text style={styles.requiredBadge}>Required to list</Text>
                )}
              </View>
            )}

            {/* Price Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Set Your Price</Text>
              <View style={styles.priceInputContainer}>
                <View style={styles.dollarSignContainer}>
                  <Text style={styles.dollarSign}>$</Text>
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
              style={[styles.listButton, !isValid() && styles.listButtonDisabled]}
              onPress={handleList}
              activeOpacity={0.8}
              disabled={!isValid()}
            >
              <Text style={styles.listButtonText}>{isEditing ? 'Save Changes' : 'List Item'}</Text>
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
      width: '85%',
      maxWidth: 400,
      maxHeight: '85%',
      padding: SPACING.containerPadding,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: SPACING.xs,
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
      marginBottom: SPACING.xl,
    },
    productImage: {
      width: 120,
      height: 120,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.md,
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
    imagePickerButton: {
      width: '100%',
      aspectRatio: 1,
      maxHeight: 180,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground || '#000000',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    listingImagePreview: {
      width: '100%',
      height: '100%',
    },
    imagePickerPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    imagePickerPlaceholderText: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: SPACING.sm,
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
    dollarSignContainer: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dollarSign: {
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
      minHeight: 100,
      maxHeight: 150,
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
