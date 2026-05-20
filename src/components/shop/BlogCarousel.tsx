import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Carousel } from '../Carousel'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import type { BlogPost } from '../../data/blogPosts'

interface BlogCarouselProps {
  items: BlogPost[]
  onItemPress?: (item: BlogPost, index: number) => void
}

export function BlogCarousel({ items, onItemPress }: BlogCarouselProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <Carousel
      items={items}
      onItemPress={onItemPress}
      renderItem={(item) => (
        <View style={styles.blogCard}>
          <View style={styles.blogTopContent}>
            <Text style={styles.blogCategory}>{item.category}</Text>
            <Text style={styles.blogTitle}>{item.title}</Text>
          </View>
          <View style={styles.blogBottomContent}>
            <View style={styles.blogLeftContent}>
              <Text style={styles.blogDescription}>{item.description}</Text>
              <View style={styles.blogButton}>
                <Text style={styles.blogButtonText}>{item.buttonText}</Text>
              </View>
            </View>
            <View style={styles.blogRightContent}>
              <View style={styles.blogImageWrap}>
                <Image
                  source={item.image}
                  style={[
                    styles.blogImage,
                    {
                      width: `${Math.min(100, 96 * (item.imageScale ?? 1))}%`,
                      height: 140 * (item.imageScale ?? 1),
                    },
                    item.imageOffsetTop != null && { marginTop: item.imageOffsetTop },
                  ]}
                  resizeMode="contain"
                />
              </View>
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
    backgroundColor: '#000000',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.cardPadding,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  blogTopContent: {
    width: '100%',
    marginBottom: 10,
  },
  blogCategory: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  blogTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
    marginBottom: 12,
    flexShrink: 1,
  },
  blogButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  blogButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  blogRightContent: {
    flex: 1,
    width: '50%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
  },
  blogImageWrap: {
    width: '100%',
    height: 148,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -4,
  },
  blogImage: {
    width: '96%',
    height: 140,
  },
})
