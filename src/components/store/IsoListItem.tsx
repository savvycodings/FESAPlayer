import { View, StyleSheet, Image } from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export interface IsoListItemData {
  id: string | number
  cardName?: string
  set?: string
  cardNumber?: string
  marketPrice?: number | null
  image?: string | null
}

interface IsoListItemProps {
  item: IsoListItemData
  imageUri?: string | null
  formatPrice?: (usd: number) => string
}

export function IsoListItem({ item, imageUri, formatPrice }: IsoListItemProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  const priceLabel =
    item.marketPrice != null && formatPrice
      ? formatPrice(Number(item.marketPrice))
      : item.marketPrice != null
        ? `R${Number(item.marketPrice)}`
        : null

  const meta = [item.set, item.cardNumber ? `#${item.cardNumber}` : null].filter(Boolean).join(' · ')

  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="image-outline" size={16} color="rgba(255,255,255,0.3)" />
          </View>
        )}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {item.cardName || 'Unnamed card'}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
    </View>
  )
}

function getStyles(theme: { textColor?: string; semiBoldFont?: string; regularFont?: string }) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.xs,
    },
    thumb: {
      width: 40,
      height: 52,
      borderRadius: RADIUS.sm,
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    thumbPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
    },
    meta: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.regularFont,
      color: 'rgba(255,255,255,0.45)',
      marginTop: 1,
    },
    price: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
    },
  })
}
