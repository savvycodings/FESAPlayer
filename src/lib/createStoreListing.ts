import { Alert } from 'react-native'
import { DOMAIN } from '../../constants'
import { authClient } from './auth-client'
import { uploadImage, isExternalUrl } from '../utils/imageUpload'

export type ListingPhotos = { front: string; back: string; close: string }

export type CreateStoreListingInput = {
  cardName: string
  price: number
  cardImage?: { uri?: string } | string
  cardId?: string
  collectionId?: number
  listingPhotos?: ListingPhotos
  quantity?: number
}

export type CreateStoreListingResult =
  | { ok: true; listing?: unknown }
  | { ok: false; message: string }

/** Create a store listing from a portfolio collection item (links collectionId when provided). */
export async function createStoreListing(
  input: CreateStoreListingInput,
): Promise<CreateStoreListingResult> {
  const {
    cardName,
    price,
    cardImage,
    cardId,
    collectionId,
    listingPhotos,
    quantity,
  } = input

  try {
    const session = await authClient.getSession()
    if (!session?.data?.session) {
      Alert.alert('Error', 'Please log in')
      return { ok: false, message: 'Not logged in' }
    }
    const sessionToken = session.data.session.token

    const uploadOne = async (uri: string): Promise<string> => {
      if (isExternalUrl(uri)) return uri
      return uploadImage(uri, 'gradeit/listings')
    }

    let imageUrl: string
    let imageBackUrl: string | undefined
    let imageCloseUrl: string | undefined

    if (listingPhotos) {
      const frontUri = listingPhotos.front
      const isTcg = frontUri.includes('images.pokemontcg.io')
      if (!frontUri || isTcg) {
        Alert.alert(
          'Photo required',
          'Please add all 3 photos of your card. Listings must use your own photos.',
        )
        return { ok: false, message: 'Photos required' }
      }
      try {
        ;[imageUrl, imageBackUrl, imageCloseUrl] = await Promise.all([
          uploadOne(listingPhotos.front),
          uploadOne(listingPhotos.back),
          uploadOne(listingPhotos.close),
        ])
      } catch (error: any) {
        Alert.alert('Upload Error', error.message || 'Failed to upload listing photos')
        return { ok: false, message: error?.message ?? 'Upload failed' }
      }
    } else {
      const imageUri =
        (cardImage as { uri?: string })?.uri ||
        (typeof cardImage === 'string' ? cardImage : null)
      const isTcg =
        imageUri && typeof imageUri === 'string' && imageUri.includes('images.pokemontcg.io')
      if (!imageUri || isTcg) {
        Alert.alert(
          'Photo required',
          'Please select a photo of your card. Listings must use a photo stored in Cloudinary.',
        )
        return { ok: false, message: 'Photo required' }
      }
      try {
        imageUrl = await uploadOne(imageUri)
      } catch (error: any) {
        Alert.alert('Upload Error', error.message || 'Failed to upload listing image')
        return { ok: false, message: error?.message ?? 'Upload failed' }
      }
    }

    const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
    const response = await fetch(`${baseUrl}/api/store/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        cardName,
        price,
        cardImage: imageUrl,
        ...(imageBackUrl && { cardImageBack: imageBackUrl }),
        ...(imageCloseUrl && { cardImageClose: imageCloseUrl }),
        ...(cardId && { cardId }),
        ...(collectionId != null && { collectionId }),
        quantity: quantity != null && quantity > 0 ? Math.floor(quantity) : 1,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      Alert.alert('Success', 'Listing created successfully! It will appear in your store.')
      return { ok: true, listing: data.listing }
    }

    Alert.alert('Error', data.message || 'Failed to create listing')
    return { ok: false, message: data.message || 'Failed to create listing' }
  } catch (error: any) {
    console.error('Error creating listing:', error)
    Alert.alert('Error', 'Failed to create listing')
    return { ok: false, message: error?.message ?? 'Failed to create listing' }
  }
}
