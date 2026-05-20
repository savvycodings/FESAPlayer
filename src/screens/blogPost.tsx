import { useContext } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { ThemedText } from '../components/ui/ThemedText'
import { getBlogPostById } from '../data/blogPosts'

export type BlogStackParams = {
  BlogPost: { id: string }
  BlogList: undefined
}

type BlogPostRouteProp = RouteProp<BlogStackParams, 'BlogPost'>
type BlogPostNavigationProp = NativeStackNavigationProp<BlogStackParams, 'BlogPost'>

function BlogPostScreen() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<BlogPostNavigationProp>()
  const route = useRoute<BlogPostRouteProp>()
  const styles = getStyles(theme)
  const post = getBlogPostById(route.params?.id ?? '')

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={theme.textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Blog</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.missingWrap}>
          <ThemedText style={styles.missingText}>This article could not be found.</ThemedText>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={theme.textColor} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {post.category}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroImageWrap}>
          <Image
            source={post.image}
            style={[
              styles.heroImage,
              {
                width: `${Math.min(100, 100 * (post.imageScale ?? 1))}%`,
                height: 268 * (post.imageScale ?? 1),
              },
              post.imageOffsetTop != null && { marginTop: post.imageOffsetTop },
            ]}
            resizeMode="contain"
          />
        </View>
        <View style={styles.article}>
          <ThemedText style={styles.title}>{post.title}</ThemedText>
          <ThemedText style={styles.meta}>
            {post.publishedAt} · {post.readTimeMinutes} min read
          </ThemedText>
          {post.body.map((paragraph, index) => (
            <ThemedText key={index} style={styles.paragraph}>
              {paragraph}
            </ThemedText>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.containerPadding,
      paddingVertical: SPACING.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -SPACING.xs,
    },
    headerTitle: {
      flex: 1,
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.semiBoldFont,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingBottom: SPACING['4xl'],
    },
    heroImageWrap: {
      width: '100%',
      height: 228,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: SPACING.sm,
      overflow: 'visible',
    },
    heroImage: {
      width: '100%',
      height: 268,
      marginTop: -2,
    },
    article: {
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.lg + 28,
    },
    title: {
      fontSize: 36,
      fontFamily: theme.boldFont,
      lineHeight: 40,
      color: '#FFFFFF',
      marginBottom: 0,
    },
    meta: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.55)',
      marginTop: -2,
      marginBottom: SPACING.lg,
    },
    paragraph: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      lineHeight: TYPOGRAPHY.body * 1.55,
      color: theme.textColor,
      marginBottom: SPACING.md,
    },
    missingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.containerPadding,
    },
    missingText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
    },
  })

export { BlogPostScreen }
export default BlogPostScreen
