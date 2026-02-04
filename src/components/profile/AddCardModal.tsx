import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native'
import { useContext, useState, useEffect } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'

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
    estimatedValue?: number
    purchasePrice?: number
    purchaseDate?: string
    notes?: string
    requestVaulting?: boolean
  }) => Promise<void> // Changed to async
}

export function AddCardModal({
  visible,
  onClose,
  onAdd,
}: AddCardModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [type, setType] = useState<'card' | 'sealed' | 'slab'>('card')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | undefined>(undefined)
  const [set, setSet] = useState('')
  const [condition, setCondition] = useState('')
  const [grade, setGrade] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [notes, setNotes] = useState('')
  const [requestVaulting, setRequestVaulting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setType('card')
      setName('')
      setDescription('')
      setImage(undefined)
      setSet('')
      setCondition('')
      setUploadError(null)
      setUploadSuccess(false)
      setGrade('')
      setEstimatedValue('')
      setPurchasePrice('')
      setNotes('')
      setRequestVaulting(false)
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
      
      // Call onAdd (which will handle upload) - modal stays open during upload
      await onAdd({
        type,
        name: name.trim(),
        description: description.trim() || undefined,
        image: image || undefined,
        set: set.trim() || undefined,
        condition: condition.trim() || undefined,
        grade: grade ? parseInt(grade) : undefined,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        notes: notes.trim() || undefined,
        requestVaulting: requestVaulting,
      })
      
      // Success! Show success message and close after a brief delay
      setIsUploading(false)
      setUploadError(null)
      setUploadSuccess(true)
      
      // Close modal after showing success message
      setTimeout(() => {
        handleClose()
      }, 1500) // Close after 1.5 seconds
    } catch (error: any) {
      console.error('Error adding card:', error)
      setUploadError(error.message || 'Failed to add card. Please try again.')
      setUploadSuccess(false)
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setImage(undefined)
    setSet('')
    setCondition('')
    setGrade('')
    setEstimatedValue('')
    setPurchasePrice('')
    setNotes('')
    setRequestVaulting(false)
    onClose()
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

            {/* Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Charizard ex"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoFocus
              />
            </View>

            {/* Image Picker */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Image</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handlePickImage}
              >
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
            </View>

            {/* Set Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Set</Text>
              <TextInput
                style={styles.textInput}
                value={set}
                onChangeText={setSet}
                placeholder="e.g., Obsidian Flames"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>

            {/* Condition Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Condition</Text>
              <TextInput
                style={styles.textInput}
                value={condition}
                onChangeText={setCondition}
                placeholder="e.g., Mint, Near Mint"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
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

            {/* Estimated Value */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Estimated Value (R)</Text>
              <TextInput
                style={styles.textInput}
                value={estimatedValue}
                onChangeText={setEstimatedValue}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Purchase Price */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Purchase Price (R)</Text>
              <TextInput
                style={styles.textInput}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="decimal-pad"
              />
            </View>

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
