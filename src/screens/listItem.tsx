import { useContext, useMemo, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Text } from '../components/ui/text'
import { AppButton } from '../components/ui/AppButton'
import { SPACING, TYPOGRAPHY, RADIUS, CARD_SURFACE } from '../constants/layout'
import * as ImagePicker from 'expo-image-picker'
import { createCollectionListing } from '../utils/createCollectionListing'

type ListItemRouteParams = {
  ListItem: {
    collectionId?: number
    cardId?: string
    productName: string
    productImage?: any
    minPriceFromMarketZar?: number
  }
}

type ListItemRouteProp = RouteProp<ListItemRouteParams, 'ListItem'>

export function ListItem() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<any>()
  const route = useRoute<ListItemRouteProp>()
  const { collectionId, cardId, productName, productImage, minPriceFromMarketZar } = route.params || ({} as any)
  const styles = getStyles(theme)

  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [frontUri, setFrontUri] = useState<string | null>(null)
  const [backUri, setBackUri] = useState<string | null>(null)
  const [closeUri, setCloseUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasRequiredImages = Boolean(frontUri && backUri && closeUri)
  const minZar = minPriceFromMarketZar

  const numericPrice = useMemo(() => parseFloat(price.replace(/[^0-9.]/g, '')) || 0, [price])
  const isValid = useMemo(() => {
    if (!hasRequiredImages) return false
    if (numericPrice <= 0) return false
    if (description.trim().length === 0) return false
    if (minZar != null && minZar > 0 && numericPrice < minZar) return false
    return true
  }, [description, hasRequiredImages, minZar, numericPrice])

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

    Alert.alert('Add photo', 'Take a new photo or choose from your library.', [
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
    ])
  }

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    if (minZar != null && minZar > 0 && numericPrice < minZar) {
      Alert.alert('Price too low', `Listing price cannot be below 80% of market value. Minimum: R${minZar.toFixed(2)}`)
      return
    }
    if (!frontUri || !backUri || !closeUri) return

    setSubmitting(true)
    try {
      const listingPhotos = { front: frontUri, back: backUri, close: closeUri }
      const ok = await createCollectionListing(
        productName,
        numericPrice,
        { uri: frontUri },
        cardId?.trim() || undefined,
        collectionId,
        listingPhotos,
        undefined
      )
      if (ok) navigation.goBack()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Item</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={32}
      >
        {productImage ? (
          <View style={styles.productPreview}>
            <Image source={productImage} style={styles.productImage} resizeMode="contain" />
            <Text style={styles.productName} numberOfLines={2}>
              {productName}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Listing photos (all 3 required)</Text>
          <Text style={styles.hint}>Add clear photos of your physical card: front, back, and a close-up (or any damage).</Text>

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

          {!hasRequiredImages ? <Text style={styles.requiredBadge}>All 3 photos required to list</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Set Your Price</Text>
          {minZar != null && minZar > 0 ? (
            <Text style={styles.hint}>Minimum 80% of market: R{minZar.toFixed(2)}</Text>
          ) : null}
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
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Item Description</Text>
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

        <AppButton
          variant="filled"
          size="lg"
          icon="pricetag-outline"
          label={submitting ? 'Listing…' : 'List'}
          fullWidth
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          style={styles.cta}
        />
      </KeyboardAwareScrollView>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundColor },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
    },
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: SPACING.containerPadding,
      paddingBottom: SPACING['3xl'],
    },
    productPreview: { alignItems: 'center', marginBottom: SPACING.lg },
    productImage: {
      width: 110,
      aspectRatio: 63 / 88,
      maxHeight: 160,
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
    section: { marginBottom: SPACING.lg },
    label: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: SPACING.xs,
    },
    hint: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
      marginBottom: SPACING.sm,
    },
    bentoRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
    bentoBox: {
      flex: 1,
      aspectRatio: 3 / 4,
      maxHeight: 130,
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
      maxHeight: 110,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground || '#000000',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      marginBottom: SPACING.xs,
    },
    bentoImage: { width: '100%', height: '100%' },
    bentoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
      maxHeight: 140,
    },
    cta: { marginTop: SPACING.sm },
  })
