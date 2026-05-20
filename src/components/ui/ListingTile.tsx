import {
  View,
  StyleSheet,
  Image,
  Pressable,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useContext } from 'react'
import { Text } from './text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, CARD_SURFACE } from '../../constants/layout'

export interface ListingTileProps {
  title: string
  price?: string
  subtitle?: string
  image?: ImageSourcePropType | null
  imageResizeMode?: 'cover' | 'contain'
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  footer?: React.ReactNode
}

export function ListingTile({
  title,
  price,
  subtitle,
  image,
  imageResizeMode = 'contain',
  onPress,
  style,
  footer,
}: ListingTileProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  const main = (
    <>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode={imageResizeMode} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.25)" />
          </View>
        )}
      </View>
      <View style={styles.infoTop}>
        {price ? (
          <Text style={styles.price} numberOfLines={1}>
            {price}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  )

  return (
    <View style={[styles.card, style]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole="button"
        >
          {main}
        </Pressable>
      ) : (
        main
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  )
}

function getStyles(theme: { regularFont?: string; boldFont?: string }) {
  return StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: CARD_SURFACE.background,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: CARD_SURFACE.border,
    },
    pressed: {
      opacity: 0.9,
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: CARD_SURFACE.background,
      borderTopLeftRadius: RADIUS.md,
      borderTopRightRadius: RADIUS.md,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTop: {
      paddingHorizontal: SPACING.xs,
      paddingTop: 4,
      paddingBottom: 2,
    },
    footer: {
      paddingHorizontal: SPACING.xs,
      paddingBottom: SPACING.xs,
      gap: SPACING.xs,
    },
    price: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.boldFont,
      fontWeight: '600',
      color: CARD_SURFACE.price,
      marginBottom: 2,
    },
    title: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textSecondary,
      lineHeight: 14,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      marginTop: 2,
    },
  })
}
