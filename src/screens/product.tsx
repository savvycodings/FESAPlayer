import { useContext, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../components/ui/text'
import { Card, CardContent } from '../components/ui/card'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { PortfolioGraph } from '../components/profile/PortfolioGraph'
import { PayFastPayment } from '../components/payment'

type ProductRouteParams = {
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
  }
  ViewProfile: {
    userId?: string
    userName: string
    userImage?: any
    userInitials?: string
    verified?: boolean
  }
}

type ProductScreenRouteProp = RouteProp<ProductRouteParams, 'Product'>
type ProductScreenNavigationProp = NativeStackNavigationProp<ProductRouteParams, 'Product'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Product() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ProductScreenNavigationProp>()
  const route = useRoute<ProductScreenRouteProp>()
  const { name, image, category, price, description } = route.params || {}
  const tintColor = theme.tintColor || '#73EC8B'
  const styles = getStyles(theme, tintColor)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [paymentType, setPaymentType] = useState<'buy' | 'bid'>('buy')

  // Format product name
  const formattedName = name
    ?.replace(/Pokémon[-_]TCG[-_]/g, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Product'

  // Default price if not provided
  const displayPrice = price || 29.99

  // Default description
  const displayDescription = description || 
    'Premium trading card product with authentic cards and exclusive items. Perfect for collectors and players alike.'

  // Bids data
  const bidsData = [
    { avatar: require('../../assets/Avatars/guy1.jpg'), name: 'Alex', bid: 145 },
    { avatar: require('../../assets/Avatars/guy2.jpg'), name: 'Michael', bid: 142 },
    { avatar: require('../../assets/Avatars/guy3.jpg'), name: 'David', bid: 140 },
    { avatar: require('../../assets/Avatars/guy4.jpg'), name: 'Emily', bid: 138 },
    { avatar: require('../../assets/Avatars/guy5.jpg'), name: 'Sarah', bid: 135 },
  ]

  // Get highest bid
  const highestBid = Math.max(...bidsData.map(b => b.bid))
  
  // Buy now price is R20 more than highest bid
  const buyNowPrice = highestBid + 20

  // Price history data for the last 7 days
  const priceHistoryData = [
    { x: 0, y: displayPrice - 5 },
    { x: 1, y: displayPrice - 3 },
    { x: 2, y: displayPrice - 2 },
    { x: 3, y: displayPrice - 1 },
    { x: 4, y: displayPrice + 1 },
    { x: 5, y: displayPrice + 2 },
    { x: 6, y: displayPrice },
  ]

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          onPress={() => setIsFavorited(!isFavorited)}
          style={styles.headerFavoriteButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={24}
            color={isFavorited ? "#FF0000" : theme.textColor}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image Card */}
        <Card style={styles.imageCard}>
          <CardContent style={styles.imageCardContent}>
            <View style={styles.imageContainer}>
              <Image
                source={image}
                style={styles.productImage}
                resizeMode="cover"
              />
            </View>
          </CardContent>
        </Card>

        {/* Thumbnail Images */}
        <View style={styles.thumbnailContainer}>
          {[1, 2, 3, 4, 5].map((index) => (
            <TouchableOpacity
              key={index}
              style={styles.thumbnailWrapper}
              activeOpacity={0.7}
            >
              <Card style={styles.thumbnailCard}>
                <CardContent style={styles.thumbnailCardContent}>
                  <View style={styles.thumbnailImageContainer}>
                    <Image
                      source={image}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Product Details Card */}
        <Card style={styles.detailsCard}>
          <CardContent style={styles.detailsContent}>
            {/* Product Name */}
            <Text style={styles.productTitle} numberOfLines={2}>
              {formattedName}
            </Text>

            {/* Seller Info with Rating */}
            <View style={styles.sellerSection}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerIconContainer}>
                  <Ionicons name="storefront-outline" size={16} color={theme.textColor} />
                </View>
                <Text style={styles.sellerName}>Kyle's Card Shop</Text>
              </View>
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={14}
                      color={tintColor}
                      style={styles.star}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>4.9</Text>
              </View>
            </View>

            {/* Price Section */}
            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <View style={styles.priceIconContainer}>
                  <Ionicons name="cash-outline" size={20} color={tintColor} />
                </View>
                <View style={styles.priceTextContainer}>
                  <Text style={styles.priceLabel}>Price</Text>
                  <Text style={styles.priceText}>
                    R{displayPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Price History Graph */}
        <PortfolioGraph
          data={priceHistoryData}
          height={140}
          color={tintColor}
          title="Price History"
          subtitle="Last 7 days"
        />

        {/* Bids Section */}
        <Card style={styles.bidsCard}>
          <CardContent style={styles.bidsContent}>
            <Text style={styles.bidsTitle}>Bids</Text>
            <View style={styles.bidsList}>
              {bidsData.map((bidder, index) => (
                <View key={index} style={styles.bidItem}>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('ViewProfile', {
                        userId: `user-${bidder.name.toLowerCase().replace(/\s+/g, '-')}`,
                        userName: bidder.name,
                        userImage: bidder.avatar,
                        userInitials: bidder.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                        verified: false,
                      })
                    }}
                    activeOpacity={0.7}
                  >
                    <Image source={bidder.avatar} style={styles.bidAvatar} />
                  </TouchableOpacity>
                  <View style={styles.bidInfo}>
                    <Text style={styles.bidderName}>{bidder.name}</Text>
                    <Text style={styles.bidAmount}>R{bidder.bid}</Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* About Section Card */}
        <Card style={styles.aboutCard}>
          <CardContent style={styles.aboutContent}>
            <View style={styles.aboutHeader}>
              <View style={styles.aboutIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color={theme.textColor} />
              </View>
              <Text style={styles.aboutHeading}>About the Product</Text>
            </View>
            <Text style={styles.descriptionText}>
              {displayDescription}
            </Text>
          </CardContent>
        </Card>

        {/* Additional spacing at bottom for bottom bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.bidNowButton}
          onPress={() => {
            setPaymentType('bid')
            setIsPaymentModalVisible(true)
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="hand-left-outline" size={20} color={theme.textColor} style={styles.bidIcon} />
          <Text style={styles.bidNowButtonText}>Bid Now</Text>
          <Text style={styles.bidNowButtonPrice}>R{highestBid + 1}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyNowButton}
          onPress={() => {
            setPaymentType('buy')
            setIsPaymentModalVisible(true)
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="flash-outline" size={20} color={theme.tintTextColor || '#000000'} style={styles.buyIcon} />
          <Text style={styles.buyNowButtonText}>Buy Now</Text>
          <Text style={styles.buyNowButtonPrice}>R{buyNowPrice}</Text>
        </TouchableOpacity>
      </View>

      {/* PayFast Payment Modal */}
      <PayFastPayment
        visible={isPaymentModalVisible}
        amount={paymentType === 'buy' ? buyNowPrice : highestBid + 1}
        itemName={formattedName}
        itemDescription={displayDescription}
        onClose={() => setIsPaymentModalVisible(false)}
        onSuccess={(paymentData) => {
          console.log('Payment successful:', paymentData)
          // Payment success is already shown in PayFastPayment component
          // Here we can handle additional actions:
          // - Update order status in database
          // - Notify seller
          // - Add to orders
          // - Refresh product data
          setIsPaymentModalVisible(false)
          // TODO: Navigate to order confirmation or refresh product
        }}
        onCancel={() => {
          console.log('Payment cancelled')
          setIsPaymentModalVisible(false)
        }}
        onError={(error) => {
          console.error('Payment error:', error)
          // TODO: Show error message to user
        }}
      />
    </View>
  )
}

const getStyles = (theme: any, tintColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: theme.backgroundColor,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  headerFavoriteButton: {
    padding: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 100, // Space for bottom action bar
  },
  imageCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  imageCardContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  thumbnailWrapper: {
    flex: 1,
  },
  thumbnailCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  thumbnailCardContent: {
    padding: 0,
  },
  thumbnailImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  detailsCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  detailsContent: {
    padding: SPACING.cardPadding,
  },
  productTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  sellerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  sellerName: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: SPACING.xs,
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  priceSection: {
    marginTop: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: hexToRgba(tintColor, 0.1),
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: hexToRgba(tintColor, 0.2),
  },
  priceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: hexToRgba(tintColor, 0.2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  priceTextContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.xs / 2,
  },
  priceText: {
    fontSize: TYPOGRAPHY.h1,
    fontFamily: theme.boldFont,
    color: tintColor,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  aboutCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  aboutContent: {
    padding: SPACING.cardPadding,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aboutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  aboutHeading: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  bidsCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  bidsContent: {
    padding: SPACING.cardPadding,
  },
  bidsTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  bidsList: {
    gap: SPACING.sm,
  },
  bidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  bidAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bidInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidderName: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
  },
  bidAmount: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: tintColor,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: SPACING.lg,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING['3xl'],
    backgroundColor: theme.backgroundColor,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: SPACING.sm,
  },
  bidNowButton: {
    flex: 1,
    backgroundColor: theme.buttonBackground || 'rgba(0, 0, 0, 0.8)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
    gap: SPACING.xs,
  },
  bidIcon: {
    marginRight: 0,
  },
  bidNowButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  bidNowButtonPrice: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: tintColor,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  buyIcon: {
    marginRight: 0,
  },
  buyNowButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.tintTextColor || '#000000',
    fontWeight: '600',
  },
  buyNowButtonPrice: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.tintTextColor ? `${theme.tintTextColor}CC` : 'rgba(0, 0, 0, 0.8)',
    fontWeight: '600',
  },
})
