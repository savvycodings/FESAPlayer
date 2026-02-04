import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

type ProfileStackParamList = {
  ProfileMain: undefined
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
  }
}

type ProductGridNavigationProp = NativeStackNavigationProp<ProfileStackParamList>

interface Product {
  id: string | number
  name: string
  price: string
  image?: any
  isListed?: boolean
}

interface ProductGridProps {
  products: Product[]
  columns?: number
  onProductPress?: (product: Product) => void
  onQuickListPress?: (product: Product) => void
}

export function ProductGrid({ products, columns = 3, onProductPress, onQuickListPress }: ProductGridProps) {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ProductGridNavigationProp>()
  const styles = getStyles(theme, columns)

  const parsePrice = (priceString: string): number => {
    const numericValue = priceString.replace(/[^0-9.]/g, '')
    return parseFloat(numericValue) || 0
  }

  const handleProductPress = (product: Product) => {
    if (onProductPress) {
      onProductPress(product)
    } else if (product.image) {
      const price = parsePrice(product.price)
      navigation.navigate('Product', {
        name: product.name,
        image: product.image,
        category: 'product',
        price: price,
        description: `Premium ${product.name}. Authentic and verified with secure shipping.`,
      })
    }
  }

  return (
    <View style={styles.container}>
      {products.map((product) => {
        return (
          <View key={product.id} style={styles.productCard}>
            <TouchableOpacity
              onPress={() => handleProductPress(product)}
              activeOpacity={0.8}
            >
              <Card style={styles.card}>
                <CardContent style={styles.productContent}>
                  <View style={styles.imageContainer}>
                    {product.image ? (
                      <Image
                        source={product.image}
                        style={styles.productImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons
                          name="image-outline"
                          size={32}
                          color="rgba(255, 255, 255, 0.3)"
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.infoSection}>
                    <Text style={styles.productPrice}>{product.price}</Text>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
            {onQuickListPress && !product.isListed && (
              <TouchableOpacity
                style={styles.quickListButton}
                onPress={() => onQuickListPress(product)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickListButtonText}>Quick List</Text>
              </TouchableOpacity>
            )}
            {product.isListed && (
              <View style={styles.listedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.tintColor || '#73EC8B'} />
                <Text style={styles.listedText}>Listed</Text>
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const getStyles = (theme: any, columns: number) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  productCard: {
    width: '31%',
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  productContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.cardBackground || '#000000',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: SPACING.sm,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  productName: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  quickListButton: {
    backgroundColor: theme.tintColor || '#73EC8B',
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  quickListButtonText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: '#000000',
    fontWeight: '600',
  },
  listedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
  },
  listedText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
})
