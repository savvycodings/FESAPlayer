import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Carousel } from '../Carousel'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface BlogItem {
  title: string
  description: string
  buttonText: string
  image: any
  category: string
}

interface BlogCarouselProps {
  items: BlogItem[]
}

export function BlogCarousel({ items }: BlogCarouselProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <Carousel
      items={items}
      renderItem={(item) => (
        <View style={styles.blogCard}>
          <View style={styles.blogTopContent}>
            <Text style={styles.blogCategory}>{item.category}</Text>
            <Text style={styles.blogTitle}>{item.title}</Text>
          </View>
          <View style={styles.blogBottomContent}>
            <View style={styles.blogLeftContent}>
              <Text style={styles.blogDescription}>{item.description}</Text>
              <TouchableOpacity
                style={styles.blogButton}
                activeOpacity={0.7}
              >
                <Text style={styles.blogButtonText}>{item.buttonText}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.blogRightContent}>
              <Image
                source={item.image}
                style={styles.blogImage}
                resizeMode="cover"
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
  blogCard: {
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
  blogTopContent: {
    width: '100%',
    marginBottom: 10,
  },
  blogCategory: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(0, 0, 0, 0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  blogTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: '#000000',
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
    width: '100%',
  },
  blogBottomContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  blogLeftContent: {
    flex: 1,
    width: '50%',
    paddingRight: 12,
  },
  blogDescription: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(0, 0, 0, 0.7)',
    lineHeight: 18,
    marginBottom: 12,
    flexShrink: 1,
  },
  blogButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  blogButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: '#000000',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  blogRightContent: {
    flex: 1,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
  },
  blogImage: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.md,
  },
})
