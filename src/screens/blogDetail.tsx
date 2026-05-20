import { useContext } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Text } from '../components/ui/text'
import { getBlogPostById } from '../data/blogPosts'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import type { ShopStackParamList } from '../navigation/shopStackTypes'

type BlogDetailRoute = RouteProp<ShopStackParamList, 'BlogDetail'>
type BlogDetailNavigation = NativeStackNavigationProp<ShopStackParamList, 'BlogDetail'>

export function BlogDetail() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<BlogDetailNavigation>()
  const route = useRoute<BlogDetailRoute>()
  const insets = useSafeAreaInsets()
  const post = getBlogPostById(route.params.blogId)
  const styles = getStyles(theme, insets.top)

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Article</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingText}>This article could not be found.</Text>
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {post.category}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Image source={post.image} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroBody}>
            <Text style={styles.category}>{post.category}</Text>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.meta}>{post.readTimeMinutes} min read</Text>
            <Text style={styles.lead}>{post.description}</Text>
          </View>
        </View>

        <View style={styles.articleCard}>
          {post.body.map((paragraph, index) => (
            <Text key={`${post.id}-p-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const getStyles = (theme: any, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset + SPACING.sm,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.containerPadding,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.screenBottom,
    },
    heroCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      marginBottom: SPACING.md,
    },
    heroImage: {
      width: '100%',
      height: 200,
    },
    heroBody: {
      padding: SPACING.lg,
    },
    category: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(0, 0, 0, 0.5)',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.xs,
    },
    title: {
      fontSize: TYPOGRAPHY.h1,
      fontFamily: theme.boldFont,
      color: '#000000',
      fontWeight: '700',
      lineHeight: 30,
      marginBottom: SPACING.xs,
    },
    meta: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(0, 0, 0, 0.45)',
      marginBottom: SPACING.md,
    },
    lead: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: 'rgba(0, 0, 0, 0.75)',
      lineHeight: TYPOGRAPHY.body * TYPOGRAPHY.lineHeightRelaxed,
    },
    articleCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    paragraph: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: 'rgba(0, 0, 0, 0.85)',
      lineHeight: TYPOGRAPHY.body * TYPOGRAPHY.lineHeightRelaxed,
      marginBottom: SPACING.md,
    },
    missing: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING['2xl'],
    },
    missingText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      textAlign: 'center',
    },
  })
