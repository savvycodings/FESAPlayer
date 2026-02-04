import {
  View,
  Text,
  TouchableHighlight,
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Alert
} from 'react-native'
import { useState, useRef, useContext } from 'react'
import { DOMAIN } from '../../constants'
import { v4 as uuid } from 'uuid'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons'
import * as ImagePicker from 'expo-image-picker'
import * as Clipboard from 'expo-clipboard'
import { useActionSheet } from '@expo/react-native-action-sheet'

const { width } = Dimensions.get('window')

type CardResult = {
  id: string
  cardImage: any
  cardName?: string
  cardNumber?: string
  aiGrade?: number
  ebayPrice?: string
  tcgPrice?: string
  portfolioLink?: string
  scannedAt: Date
}

export function Grade() {
  const [cards, setCards] = useState<CardResult[]>([])
  const [loading, setLoading] = useState(false)
  const [processingCard, setProcessingCard] = useState<string | null>(null)
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const scrollViewRef = useRef<ScrollView | null>(null)
  const { showActionSheetWithOptions } = useActionSheet()

  async function scanCard() {
    try {
      // Request camera permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to scan cards.')
        return
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [3, 4], // Card aspect ratio
      })

      if (!result.canceled && result.assets[0]) {
        await processCardImage(result.assets[0])
      }
    } catch (err) {
      console.log('error scanning card:', err)
      Alert.alert('Error', 'Failed to scan card. Please try again.')
    }
  }

  async function pickCardFromLibrary() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [3, 4],
      })

      if (!result.canceled && result.assets[0]) {
        await processCardImage(result.assets[0])
      }
    } catch (err) {
      console.log('error picking card:', err)
      Alert.alert('Error', 'Failed to pick card. Please try again.')
    }
  }

  function createFormData(imageAsset: ImagePicker.ImagePickerAsset): FormData {
    const isDataUri = imageAsset.uri.startsWith('data:')
    const formData = new FormData()
    
    if (isDataUri) {
      const matches = imageAsset.uri.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        throw new Error('Invalid data URI format')
      }
      
      const mimeType = matches[1] || imageAsset.mimeType || 'image/jpeg'
      const base64Data = matches[2]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })
      formData.append('image', blob, uuid() + '.jpg')
    } else {
      // @ts-ignore
      formData.append('image', {
        uri: imageAsset.uri.replace('file://', ''),
        name: uuid() + '.jpg',
        type: imageAsset.mimeType || 'image/jpeg',
      })
    }
    
    return formData
  }

  async function processCardImage(imageAsset: ImagePicker.ImagePickerAsset) {
    const cardId = uuid()
    const newCard: CardResult = {
      id: cardId,
      cardImage: imageAsset,
      scannedAt: new Date(),
    }

    setCards(prev => [...prev, newCard])
    setProcessingCard(cardId)
    setLoading(true)

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)

    try {
      // Step 1: Recognize card
      const formData = createFormData(imageAsset)

      // Step 1: Recognize card
      const recognizeResponse = await fetch(`${DOMAIN}/pokedata/recognize`, {
        method: 'POST',
        body: formData,
      })

      if (!recognizeResponse.ok) {
        const errorData = await recognizeResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to recognize card from image')
      }

      const recognizeData = await recognizeResponse.json()
      
      if (!recognizeData.success || !recognizeData.card) {
        throw new Error('Could not identify card from image. Please try again with a clearer image.')
      }

      const recognizedCard = recognizeData.card

      // Step 2: Search for card
      const searchQueryParts = [recognizedCard.name]
      if (recognizedCard.set) searchQueryParts.push(recognizedCard.set)
      if (recognizedCard.number) searchQueryParts.push(recognizedCard.number)
      const searchQuery = searchQueryParts.join(' ')

      const searchParams = new URLSearchParams({
        query: searchQuery,
        asset_type: 'CARD',
      })

      const searchResponse = await fetch(`${DOMAIN}/pokedata/search?${searchParams}`)
      
      if (!searchResponse.ok) {
        throw new Error('Failed to search for card')
      }

      const searchData = await searchResponse.json()
      const searchResults = searchData.results || []

      if (searchResults.length === 0) {
        throw new Error('No cards found matching the image')
      }

      const matchedCard = searchResults[0]

      // Step 3: Get pricing
      const pricingParams = new URLSearchParams({
        id: matchedCard.id,
        asset_type: 'CARD',
      })

      const pricingResponse = await fetch(`${DOMAIN}/pokedata/pricing?${pricingParams}`)
      
      if (!pricingResponse.ok) {
        throw new Error('Failed to fetch pricing')
      }

      const pricingData = await pricingResponse.json()
      const pricingObj = pricingData.pricing || {}
      const marketplaces = pricingObj.pricing || {}
      const ebayPrice = marketplaces['eBay Raw']?.value
      const tcgPrice = marketplaces['TCGPlayer']?.value

      const formatPrice = (value: number | undefined) => {
        if (!value) return 'N/A'
        return `$${value.toFixed(2)}`
      }

      // Step 4: Get AI grade
      let aiGrade: number | undefined
      try {
        const gradeFormData = createFormData(imageAsset)
        const gradeResponse = await fetch(`${DOMAIN}/pokedata/grade`, {
          method: 'POST',
          body: gradeFormData,
        })

        if (gradeResponse.ok) {
          const gradeData = await gradeResponse.json()
          if (gradeData.success && gradeData.grade) {
            aiGrade = gradeData.grade
          }
        }
      } catch (gradeError) {
        // Continue without grade - don't fail the whole process
      }

      // Generate portfolio link (you'll need to implement this endpoint)
      const portfolioLink = `https://saplayer.app/portfolio/${cardId}`

      // Update card with results
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? {
              ...card,
              cardName: matchedCard.name,
              cardNumber: matchedCard.number || '',
              aiGrade: aiGrade,
              ebayPrice: formatPrice(ebayPrice),
              tcgPrice: formatPrice(tcgPrice),
              portfolioLink,
            }
          : card
      ))

      setLoading(false)
      setProcessingCard(null)

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (err: any) {
      setLoading(false)
      setProcessingCard(null)
      
      // Update card with error state
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? {
              ...card,
              cardName: 'Unable to identify card',
              aiGrade: undefined,
              ebayPrice: undefined,
              tcgPrice: undefined,
            }
          : card
      ))

      Alert.alert(
        'Error', 
        err.message || 'Failed to process card. Please try again or ensure the card is clearly visible.'
      )
    }
  }

  async function copyPortfolioLink(portfolioLink: string) {
    await Clipboard.setStringAsync(portfolioLink)
    Alert.alert('Copied!', 'Portfolio link copied to clipboard.')
  }

  async function sharePortfolioLink(portfolioLink: string) {
    showActionSheetWithOptions(
      {
        options: ['Copy Link', 'Open in Browser', 'Cancel'],
        cancelButtonIndex: 2,
      },
      async (selectedIndex) => {
        if (selectedIndex === 0) {
          await copyPortfolioLink(portfolioLink)
        } else if (selectedIndex === 1) {
          try {
            await Linking.openURL(portfolioLink)
          } catch (err) {
            Alert.alert('Error', 'Could not open link.')
          }
        }
      }
    )
  }

  function showCardActions(card: CardResult) {
    const options = ['Share Portfolio Link', 'Delete Card', 'Cancel']
    const cancelButtonIndex = 2
    const destructiveButtonIndex = 1

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (selectedIndex) => {
        if (selectedIndex === 0 && card.portfolioLink) {
          sharePortfolioLink(card.portfolioLink)
        } else if (selectedIndex === 1) {
          setCards(prev => prev.filter(c => c.id !== card.id))
        }
      }
    )
  }

  function clearAllCards() {
    Alert.alert(
      'Clear All Cards',
      'Are you sure you want to clear all scanned cards?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setCards([])
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.container}
        keyboardVerticalOffset={110}
      >
        <ScrollView
          contentContainerStyle={cards.length === 0 ? styles.scrollContentContainer : styles.scrollContentContainerWithCards}
          ref={scrollViewRef}
          style={styles.scrollContainer}
        >
          {cards.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateContent}>
                <MaterialIcons
                  name="card-search"
                  size={64}
                  color={theme.tintColor}
                />
                <Text style={styles.emptyStateTitle}>
                  Scan Your Pokémon Cards
                </Text>
                <Text style={styles.description}>
                  The all-in-one Pokémon TCG app that scans your card, gives an AI grade, checks real prices, and generates a portfolio link you can share with any trader.
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableHighlight
                    onPress={scanCard}
                    underlayColor={'transparent'}
                  >
                    <View style={styles.primaryButton}>
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color={theme.tintTextColor}
                      />
                      <Text style={styles.primaryButtonText}>
                        Scan Card
                      </Text>
                    </View>
                  </TouchableHighlight>
                  <TouchableHighlight
                    onPress={pickCardFromLibrary}
                    underlayColor={'transparent'}
                  >
                    <View style={styles.secondaryButton}>
                      <Ionicons
                        name="images-outline"
                        size={22}
                        color={theme.textColor}
                      />
                      <Text style={styles.secondaryButtonText}>
                        Choose from Library
                      </Text>
                    </View>
                  </TouchableHighlight>
                </View>
                <View style={styles.featuresContainer}>
                  <View style={styles.feature}>
                    <MaterialIcons name="robot" size={20} color={theme.tintColor} />
                    <Text style={styles.featureText}>AI Grading</Text>
                  </View>
                  <View style={styles.feature}>
                    <MaterialIcons name="tag" size={20} color={theme.tintColor} />
                    <Text style={styles.featureText}>Live Pricing</Text>
                  </View>
                  <View style={styles.feature}>
                    <MaterialIcons name="link" size={20} color={theme.tintColor} />
                    <Text style={styles.featureText}>Portfolio Link</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              {cards.map((card, index) => (
                <View key={card.id} style={styles.cardContainer}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardIndex}>Card {index + 1}</Text>
                      {card.scannedAt && (
                        <Text style={styles.cardDate}>
                          {new Date(card.scannedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <TouchableHighlight
                      onPress={() => showCardActions(card)}
                      underlayColor={'transparent'}
                    >
                      <MaterialIcons
                        name="dots-horizontal"
                        size={24}
                        color={theme.textColor}
                      />
                    </TouchableHighlight>
                  </View>

                  <Image
                    source={{ uri: card.cardImage.uri }}
                    style={styles.cardImage}
                  />

                  {processingCard === card.id && loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={theme.tintColor} />
                      <Text style={styles.loadingText}>Processing card...</Text>
                    </View>
                  ) : card.aiGrade ? (
                    <View style={styles.cardDetails}>
                      {card.cardName && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Card Name:</Text>
                          <Text style={styles.detailValue}>{card.cardName}</Text>
                        </View>
                      )}
                      {card.cardNumber && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Card Number:</Text>
                          <Text style={styles.detailValue}>{card.cardNumber}</Text>
                        </View>
                      )}
                      <View style={styles.gradeContainer}>
                        <MaterialIcons name="star" size={24} color={theme.tintColor} />
                        <Text style={styles.gradeLabel}>AI Grade:</Text>
                        <Text style={styles.gradeValue}>{card.aiGrade}</Text>
                      </View>
                      <View style={styles.pricingContainer}>
                        <View style={styles.priceBox}>
                          <Text style={styles.priceLabel}>eBay Last Sold</Text>
                          <Text style={styles.priceValue}>{card.ebayPrice}</Text>
                        </View>
                        <View style={styles.priceBox}>
                          <Text style={styles.priceLabel}>TCG Price</Text>
                          <Text style={styles.priceValue}>{card.tcgPrice}</Text>
                        </View>
                      </View>
                      {card.portfolioLink && (
                        <TouchableHighlight
                          onPress={() => sharePortfolioLink(card.portfolioLink!)}
                          underlayColor={'transparent'}
                        >
                          <View style={styles.portfolioButton}>
                            <MaterialIcons
                              name="link-variant"
                              size={20}
                              color={theme.tintTextColor}
                            />
                            <Text style={styles.portfolioButtonText}>
                              Share Portfolio Link
                            </Text>
                          </View>
                        </TouchableHighlight>
                      )}
                    </View>
                  ) : null}
                </View>
              ))}
              {cards.length > 0 && (
                <TouchableHighlight
                  onPress={clearAllCards}
                  underlayColor={'transparent'}
                  style={styles.clearButtonContainer}
                >
                  <Text style={styles.clearButtonText}>Clear All Cards</Text>
                </TouchableHighlight>
              )}
            </>
          )}
        </ScrollView>
        {cards.length > 0 && (
          <View style={styles.bottomActions}>
            <TouchableHighlight
              onPress={scanCard}
              underlayColor={'transparent'}
            >
              <View style={styles.scanButton}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={theme.tintTextColor}
                />
                <Text style={styles.scanButtonText}>Scan Another Card</Text>
              </View>
            </TouchableHighlight>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContentContainer: {
    flex: 1,
  },
  scrollContentContainerWithCards: {
    paddingBottom: 100,
  },
  scrollContainer: {
    paddingTop: 10,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: theme.tintColor,
    gap: 10,
  },
  primaryButtonText: {
    color: theme.tintTextColor,
    fontFamily: theme.boldFont,
    fontSize: 18,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.borderColor,
    gap: 10,
  },
  secondaryButtonText: {
    color: theme.textColor,
    fontFamily: theme.semiBoldFont,
    fontSize: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: theme.mediumFont,
    color: theme.textColor,
  },
  cardContainer: {
    marginBottom: 20,
    marginHorizontal: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 12,
    backgroundColor: theme.backgroundColor,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    gap: 4,
  },
  cardIndex: {
    fontSize: 16,
    fontFamily: theme.boldFont,
    color: theme.textColor,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: theme.mediumFont,
    color: theme.mutedForegroundColor,
  },
  cardDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: theme.semiBoldFont,
    color: theme.mutedForegroundColor,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: theme.mediumFont,
    color: theme.textColor,
    flex: 1,
    textAlign: 'right',
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: theme.tintColor + '15',
    borderRadius: 8,
    marginVertical: 8,
  },
  gradeLabel: {
    fontSize: 16,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
  },
  gradeValue: {
    fontSize: 24,
    fontFamily: theme.boldFont,
    color: '#FF0000',
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  priceBox: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: theme.boldFont,
    color: theme.textColor,
  },
  portfolioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: theme.tintColor,
    gap: 10,
    marginTop: 8,
  },
  portfolioButtonText: {
    color: theme.tintTextColor,
    fontFamily: theme.boldFont,
    fontSize: 16,
  },
  clearButtonContainer: {
    marginHorizontal: 10,
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: theme.mediumFont,
    color: theme.mutedForegroundColor,
  },
  bottomActions: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    backgroundColor: theme.backgroundColor,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: theme.tintColor,
    gap: 10,
  },
  scanButtonText: {
    color: theme.tintTextColor,
    fontFamily: theme.boldFont,
    fontSize: 16,
  },
})

