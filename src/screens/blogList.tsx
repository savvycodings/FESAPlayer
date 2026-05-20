import { useContext } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { ThemedText } from '../components/ui/ThemedText'
import { BLOG_POSTS } from '../data/blogPosts'
import type { BlogStackParams } from './blogPost'

type BlogListNavigationProp = NativeStackNavigationProp<BlogStackParams, 'BlogList'>

function BlogList() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<BlogListNavigationProp>()
  const styles = getStyles(theme)

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {BLOG_POSTS.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.listCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BlogPost', { id: post.id })}
          >
            <View style={styles.listImageWrap}>
              <Image
                source={post.image}
                style={[
                  styles.listImage,
                  {
                    width: 76 * (post.imageScale ?? 1),
                    height: 76 * (post.imageScale ?? 1),
                  },
                  post.imageOffsetTop != null && { marginTop: post.imageOffsetTop },
                ]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.listBody}>
              <ThemedText style={styles.listCategory}>{post.category}</ThemedText>
              <ThemedText style={styles.listTitle} numberOfLines={2}>
                {post.title}
              </ThemedText>
              <ThemedText style={styles.listDescription} numberOfLines={2}>
                {post.description}
              </ThemedText>
              <ThemedText style={styles.listMeta}>
                {post.publishedAt} · {post.readTimeMinutes} min read
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.45)'}
            />
          </TouchableOpacity>
        ))}
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
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.boldFont,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: SPACING.containerPadding,
      paddingBottom: SPACING['4xl'],
      gap: SPACING.sm,
    },
    listCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: SPACING.sm,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
      backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.04)',
    },
    listImageWrap: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listImage: {
      width: 76,
      height: 76,
      marginTop: -2,
    },
    listBody: {
      flex: 1,
      minWidth: 0,
    },
    listCategory: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.55)',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    listTitle: {
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.semiBoldFont,
      marginBottom: 2,
    },
    listDescription: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.65)',
      marginBottom: 4,
    },
    listMeta: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.45)',
    },
  })

export { BlogList }
export default BlogList
