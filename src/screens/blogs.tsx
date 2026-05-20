import { useContext, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Text } from '../components/ui/text'
import { BlogTile } from '../components/shop/BlogTile'
import { BLOG_POSTS } from '../data/blogPosts'
import { SPACING, TYPOGRAPHY } from '../constants/layout'
import type { ShopStackParamList } from '../navigation/shopStackTypes'

type BlogsNavigationProp = NativeStackNavigationProp<ShopStackParamList, 'Blogs'>

export function Blogs() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<BlogsNavigationProp>()
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme, insets.top)

  const openArticle = useCallback(
    (blogId: string) => {
      navigation.navigate('BlogDetail', { blogId })
    },
    [navigation],
  )

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
        <Text style={styles.headerTitle}>Blog</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {BLOG_POSTS.map((post) => (
          <BlogTile key={post.id} item={post} onReadMorePress={openArticle} />
        ))}
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
      fontSize: TYPOGRAPHY.h2,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.screenBottom,
    },
  })
