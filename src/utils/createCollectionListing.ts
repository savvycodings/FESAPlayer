import { Alert } from 'react-native'
import { DOMAIN } from '../../constants'
import { authClient } from '../lib/auth-client'
import { uploadImage, isExternalUrl } from './imageUpload'

export type ListingPhotos = { front: string; back: string; close: string }

export async function createCollectionListing(
  cardName: string,
  price: number,
  cardImage?: { uri?: string } | string,
  cardId?: string,
  collectionId?: number,
  listingPhotos?: ListingPhotos,
  quantity?: number
): Promise<boolean> {
  try {
    const session = await authClient.getSession()
    if (!session?.data?.session) {
      Alert.alert('Error', 'Please log in')
      return false
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
          'Please add all 3 photos of your card. Listings must use your own photos.'
        )
        return false
      }
      try {
        ;[imageUrl, imageBackUrl, imageCloseUrl] = await Promise.all([
          uploadOne(listingPhotos.front),
          uploadOne(listingPhotos.back),
          uploadOne(listingPhotos.close),
        ])
      } catch (error: any) {
        Alert.alert('Upload Error', error.message || 'Failed to upload listing photos')
        return false
      }
    } else {
      const imageUri = cardImage?.uri || (typeof cardImage === 'string' ? cardImage : null)
      const isTcg =
        imageUri && typeof imageUri === 'string' && imageUri.includes('images.pokemontcg.io')
      if (!imageUri || isTcg) {
        Alert.alert(
          'Photo required',
          'Please select a photo of your card. Listings must use a photo stored in Cloudinary.'
        )
        return false
      }
      try {
        imageUrl = await uploadOne(imageUri)
      } catch (error: any) {
        Alert.alert('Upload Error', error.message || 'Failed to upload listing image')
        return false
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
      return true
    }
    Alert.alert('Error', data.message || 'Failed to create listing')
    return false
  } catch (error: any) {
    console.error('Error creating listing:', error)
    Alert.alert('Error', 'Failed to create listing')
    return false
  }
}
