import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import type { BlogPost } from '../../data/blogPosts'

export type BlogTileCardProps = {
  item: Pick<BlogPost, 'title' | 'description' | 'buttonText' | 'image' | 'category'>
  onReadMorePress?: () => void
  /** Carousel slide (fixed height) vs list row (min height) */
  variant?: 'carousel' | 'list'
}

/** Shared blog tile layout — Shop carousel, Blogs list, and future surfaces */
export function BlogTileCard({ item, onReadMorePress, variant = 'carousel' }: BlogTileCardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, variant)

  return (
    <View style={styles.blogCard}>
      <View style={styles.blogTopContent}>
        <Text style={styles.blogCategory}>{item.category}</Text>
        <Text style={styles.blogTitle}>{item.title}</Text>
      </View>
      <View style={styles.blogBottomContent}>
        <View style={styles.blogLeftContent}>
          <Text style={styles.blogDescription} numberOfLines={variant === 'list' ? 4 : undefined}>
            {item.description}
          </Text>
          <TouchableOpacity
            style={styles.blogButton}
            activeOpacity={0.7}
            onPress={onReadMorePress}
            disabled={!onReadMorePress}
          >
            <Text style={styles.blogButtonText}>{item.buttonText}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.blogRightContent}>
          <Image source={item.image} style={styles.blogImage} resizeMode="cover" />
        </View>
      </View>
    </View>
  )
}

const getStyles = (theme: any, variant: 'carousel' | 'list') =>
  StyleSheet.create({
    blogCard: {
      width: '100%',
      height: variant === 'carousel' ? '100%' : undefined,
      minHeight: variant === 'list' ? 200 : undefined,
      backgroundColor: '#FFFFFF',
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      padding: SPACING.cardPadding,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      marginBottom: variant === 'list' ? SPACING.md : 0,
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
