import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { ThemedText } from '../ui/ThemedText'
import { Carousel } from '../Carousel'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export type PromoAction =
  | { type: 'category'; categoryId: string }
  | { type: 'product'; name: string; image: any; category?: 'product' | 'set' | 'single' | 'featured' | 'listing' }
  | { type: 'set'; setName: string; setImage: any }

export interface PromoItem {
  title: string
  description: string
  buttonText: string
  image: any
  /** When set, the button will trigger this action (category filter or product page) */
  action?: PromoAction
}

interface PromoCarouselProps {
  items: PromoItem[]
  onButtonPress?: (item: PromoItem) => void
}

export function PromoCarousel({ items, onButtonPress }: PromoCarouselProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <Carousel
      items={items}
      renderItem={(item) => (
        <View style={styles.promoCard}>
          <View style={styles.promoTopContent}>
            <ThemedText style={styles.promoLabel}>PROMO</ThemedText>
            <ThemedText style={styles.promoTitle}>{item.title}</ThemedText>
          </View>
          <View style={styles.promoBottomContent}>
            <View style={styles.promoLeftContent}>
              <ThemedText style={styles.promoDescription}>{item.description}</ThemedText>
              <TouchableOpacity
                style={styles.promoButton}
                activeOpacity={0.7}
                onPress={() => onButtonPress?.(item)}
              >
                <ThemedText style={styles.promoButtonText}>{item.buttonText}</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.promoRightContent}>
              <Image
                source={item.image}
                style={styles.promoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      )}
      itemWidth={360}
      itemHeight={200}
      itemSpacing={8}
    />
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  promoCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.cardPadding,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  promoTopContent: {
    width: '100%',
    marginBottom: 10,
  },
  promoLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: '#000000',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  promoTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: '#000000',
    lineHeight: 24,
    letterSpacing: -0.2,
    width: '100%',
  },
  promoBottomContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  promoLeftContent: {
    flex: 1,
    width: '50%',
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  promoDescription: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(0, 0, 0, 0.8)',
    lineHeight: 18,
    marginBottom: 12,
    flexShrink: 1,
  },
  promoButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  promoButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  promoRightContent: {
    flex: 1,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
  },
  promoImage: {
    width: '100%',
    height: 160,
    aspectRatio: 1,
  },
})
