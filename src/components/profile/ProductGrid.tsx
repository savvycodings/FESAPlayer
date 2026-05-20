import { View, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../ui/text'
import { AppButton } from '../ui/AppButton'
import { PortfolioCardTile } from './PortfolioCardTile'
import { ListingTileGrid } from '../ui/ListingTileGrid'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, CARD_SURFACE } from '../../constants/layout'

type ProfileStackParamList = {
  ProfileMain: undefined
  Product: {
    id?: string
    cardId?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    ebayPrice?: number
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
  cardId?: string
  ebayPrice?: number
  setName?: string
  cardNumber?: string
  metaLine?: string
  condition?: string
  finishLabel?: string
  quantity?: number
  priceChangeZar?: number | null
  priceChangePercent?: number | null
}

interface ProductGridProps {
  products: Product[]
  columns?: number
  onProductPress?: (product: Product) => void
  onQuickListPress?: (product: Product) => void
}

export function ProductGrid({
  products,
  columns: columnsProp = 2,
  onProductPress,
  onQuickListPress,
}: ProductGridProps) {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<ProductGridNavigationProp>()
  const styles = getStyles(theme)

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
        description: product.name,
        ...(product.cardId && { cardId: product.cardId }),
        ...(product.ebayPrice != null && { ebayPrice: product.ebayPrice }),
      })
    }
  }

  return (
    <ListingTileGrid
      data={products}
      columns={columnsProp}
      keyExtractor={(product) => String(product.id)}
      renderItem={(product) => {
        const footer =
          onQuickListPress && !product.isListed ? (
            <AppButton
              variant="filled"
              size="sm"
              tile
              label="List"
              fullWidth
              onPress={() => onQuickListPress(product)}
            />
          ) : product.isListed ? (
            <View style={styles.listedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={CARD_SURFACE.textPrimary} />
              <Text style={styles.listedText}>Listed</Text>
            </View>
          ) : null

        return (
          <PortfolioCardTile
            title={product.name}
            setName={product.setName}
            cardNumber={product.cardNumber}
            metaLine={product.metaLine}
            condition={product.condition}
            finishLabel={product.finishLabel}
            quantity={product.quantity ?? 1}
            price={product.price}
            priceChangeZar={product.priceChangeZar}
            priceChangePercent={product.priceChangePercent}
            image={product.image}
            onPress={() => handleProductPress(product)}
            footer={footer}
          />
        )
      }}
    />
  )
}

const getStyles = (theme: { textColor?: string; semiBoldFont?: string }) =>
  StyleSheet.create({
    listedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 0,
      marginBottom: 0,
    },
    listedText: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.semiBoldFont,
      color: CARD_SURFACE.textPrimary,
      fontWeight: '600',
    },
  })
