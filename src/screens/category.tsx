import { useContext } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../components/ui/text'
import { Carousel } from '../components/Carousel'
import { Card, CardContent } from '../components/ui/card'
import { Section } from '../components/layout/Section'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'

type CategoryStackParamList = {
  Category: {
    categoryName: string
    categoryType: 'featured' | 'set'
    items: Array<{
      name: string
      image: any
    }>
  }
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
  }
  SetProducts: {
    setName: string
    setImage: any
  }
}

type CategoryScreenRouteProp = RouteProp<CategoryStackParamList, 'Category'>
type CategoryScreenNavigationProp = NativeStackNavigationProp<CategoryStackParamList, 'Category'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 50) / 3 // 3 columns with padding

// Sample products data
const sampleProducts = [
  { name: 'Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Hidden_Fates_Elite_Trainer_Box.jpg') },
  { name: 'Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_Destined_Rivals_Pokmon_Center_Elite_Trainer_Box.jpg') },
  { name: 'Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Phantasmal_Flames_Booster_Bundle.jpg') },
  { name: 'Pokmon_TCG_Scarlet_Violet_White_Flare_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_White_Flare_Pokmon_Center_Elite_Trainer_Box.jpg') },
  { name: 'Pokmon_TCG_Scarlet_Violet_151_Booster_Bundle', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet_Violet_151_Booster_Bundle.jpg') },
  { name: 'Pokmon_TCG_Crown_Zenith_Pokmon_Center_Elite_Trainer_Box_Plus', image: require('../../assets/products/pokevault/Pokmon_TCG_Crown_Zenith_Pokmon_Center_Elite_Trainer_Box_Plus.jpg') },
  { name: 'Pokmon_TCG_Scarlet__Violet151_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet__Violet151_Pokmon_Center_Elite_Trainer_Box.jpg') },
  { name: 'Pokmon_TCG_Mega_Evolution_Pokmon_Center_Elite_Trainer_Box_Mega_Gardevoir', image: require('../../assets/products/pokevault/Pokmon_TCG_Mega_Evolution_Pokmon_Center_Elite_Trainer_Box_Mega_Gardevoir.jpg') },
  { name: 'Pokmon_TCG_Scarlet__VioletStellar_Crown_Pokmon_Center_Elite_Trainer_Box', image: require('../../assets/products/pokevault/Pokmon_TCG_Scarlet__VioletStellar_Crown_Pokmon_Center_Elite_Trainer_Box.jpg') },
]

export function Category() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<CategoryScreenNavigationProp>()
  const route = useRoute<CategoryScreenRouteProp>()
  const { categoryName, categoryType, items } = route.params || { categoryName: '', categoryType: 'featured', items: [] }
  const styles = getStyles(theme)

  const formatName = (name: string) => {
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {formatName(categoryName)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title={formatName(categoryName)}>
          <Carousel
            items={items}
            renderItem={(item, index) => {
              return (
                <Card style={styles.carouselCard}>
                  <CardContent style={styles.carouselCardContent}>
                    <View style={[
                      styles.carouselItemContainer,
                      { backgroundColor: categoryType === 'set' ? '#FFFFFF' : theme.backgroundColor }
                    ]}>
                      <Image
                        source={item.image}
                        style={styles.carouselImage}
                        resizeMode={categoryType === 'set' ? 'contain' : 'cover'}
                      />
                    </View>
                  </CardContent>
                </Card>
              )
            }}
            itemWidth={280}
            itemHeight={200}
            itemSpacing={SPACING.md}
            onItemPress={(item) => {
              if (categoryType === 'set') {
                navigation.navigate('SetProducts', {
                  setName: item.name,
                  setImage: item.image,
                })
              } else {
                navigation.navigate('Product', {
                  name: item.name,
                  image: item.image,
                  category: categoryType,
                })
              }
            }}
          />
        </Section>

        {/* Products Grid */}
        <Section title="Products">
          <View style={styles.productsGrid}>
            {sampleProducts.map((product, index) => {
              const formattedName = formatName(product.name)
              const isLastInRow = (index + 1) % 3 === 0
              const randomPrice = parseFloat((Math.random() * (500 - 25) + 25).toFixed(2))
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.productCardContainer,
                    isLastInRow && styles.productCardLast
                  ]}
                  onPress={() => {
                    navigation.navigate('Product', {
                      name: product.name,
                      image: product.image,
                      category: 'product',
                      price: randomPrice,
                      description: `Premium ${formattedName} product. Authentic and verified with secure shipping.`,
                    })
                  }}
                  activeOpacity={0.8}
                >
                  <Card style={styles.productCard}>
                    <CardContent style={styles.productCardContent}>
                      <View style={styles.productImageContainer}>
                        <Image
                          source={product.image}
                          style={styles.productImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.productTextContainer}>
                        <View>
                          <Text style={styles.productCardTitle} numberOfLines={2}>
                            {formattedName}
                          </Text>
                          <Text style={styles.productCardSubText}>Product</Text>
                        </View>
                        <Text style={styles.productCardPrice}>
                          ${randomPrice.toFixed(2)}
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              )
            })}
          </View>
        </Section>
      </ScrollView>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
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
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING['4xl'],
  },
  carouselCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  carouselCardContent: {
    padding: 0,
    width: '100%',
    height: '100%',
  },
  carouselItemContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  productCardContainer: {
    width: PRODUCT_CARD_WIDTH,
    marginBottom: SPACING.lg,
    marginRight: 5,
  },
  productCardLast: {
    marginRight: 0,
  },
  productCard: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  productCardContent: {
    padding: 0,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productTextContainer: {
    padding: SPACING.sm,
    backgroundColor: theme.cardBackground || '#000000',
  },
  productCardTitle: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
    minHeight: 32,
  },
  productCardSubText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.sm,
  },
  productCardPrice: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
})
