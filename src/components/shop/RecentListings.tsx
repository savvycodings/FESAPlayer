import { View, StyleSheet, Image, ImageBackground, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface ListingItem {
  image: any
  nameIndex: number
  category?: string
}

interface RecentListingsProps {
  listings: ListingItem[]
  listingNames: string[]
}

type ShopStackParamList = {
  ShopMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
  }
}

type RecentListingsNavigationProp = NativeStackNavigationProp<ShopStackParamList, 'ShopMain'>

export function RecentListings({ listings, listingNames }: RecentListingsProps) {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<RecentListingsNavigationProp>()
  const styles = getStyles(theme)

  return (
    <View style={styles.recentListingsGrid}>
      {listings.map((item, index) => {
        const randomPrice = parseFloat((Math.random() * (500 - 25) + 25).toFixed(2))
        const isLeftBox = index % 2 === 0
        const isRightBox = index % 2 === 1
        const listingName = listingNames[item.nameIndex]
        
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.listingCard, 
              isLeftBox && styles.listingCardLeft, 
              isRightBox && styles.listingCardRight
            ]}
            onPress={() => {
              navigation.navigate('Product', {
                name: listingName,
                image: item.image,
                category: item.category === 'singles' ? 'single' : item.category === 'slabbed' ? 'listing' : 'product',
                price: randomPrice,
                description: `Premium ${listingName}. Authentic and verified with secure shipping.`,
              })
            }}
            activeOpacity={0.8}
          >
            {item.image ? (
              <ImageBackground
                source={item.image}
                style={styles.imageBackground}
                resizeMode="cover"
                imageStyle={styles.imageStyle}
              >
                <View style={styles.listingTextOverlay}>
                  <View style={styles.listingTextContent}>
                    <Text style={styles.listingText} numberOfLines={1} ellipsizeMode="tail">
                      {listingName}
                    </Text>
                    <Text style={styles.listingSubText} numberOfLines={1} ellipsizeMode="tail">
                      peoples name
                    </Text>
                  </View>
                  <Text style={styles.listingPrice}>R{randomPrice.toFixed(2)}</Text>
                </View>
              </ImageBackground>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.3)'}
                />
                <View style={styles.listingTextOverlay}>
                  <View style={styles.listingTextContent}>
                    <Text style={styles.listingText} numberOfLines={1} ellipsizeMode="tail">
                      {listingName}
                    </Text>
                    <Text style={styles.listingSubText} numberOfLines={1} ellipsizeMode="tail">
                      peoples name
                    </Text>
                  </View>
                  <Text style={styles.listingPrice}>R{randomPrice.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  recentListingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 0,
    marginRight: 0,
    justifyContent: 'space-between',
  },
  listingCard: {
    width: '48%',
    aspectRatio: 0.75,
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  listingCardLeft: {
    marginRight: '2%',
  },
  listingCardRight: {
    marginLeft: '2%',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: RADIUS.lg,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.cardBackground || '#000000',
    position: 'relative',
  },
  listingTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  listingTextContent: {
    marginBottom: 6,
  },
  listingText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  listingSubText: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: theme.textColor || 'rgba(255, 255, 255, 0.85)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  listingPrice: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
})
