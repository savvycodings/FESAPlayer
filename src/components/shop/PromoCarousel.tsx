import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Carousel } from '../Carousel'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface PromoItem {
  title: string
  description: string
  buttonText: string
  image: any
}

interface PromoCarouselProps {
  items: PromoItem[]
}

export function PromoCarousel({ items }: PromoCarouselProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <Carousel
      items={items}
      renderItem={(item) => (
        <View style={styles.promoCard}>
          <View style={styles.promoTopContent}>
            <Text style={styles.promoLabel}>PROMO</Text>
            <Text style={styles.promoTitle}>{item.title}</Text>
          </View>
          <View style={styles.promoBottomContent}>
            <View style={styles.promoLeftContent}>
              <Text style={styles.promoDescription}>{item.description}</Text>
              <TouchableOpacity
                style={styles.promoButton}
                activeOpacity={0.7}
              >
                <Text style={styles.promoButtonText}>{item.buttonText}</Text>
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
    fontWeight: '600',
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
    fontWeight: '600',
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
