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
import { androidLabelStyle } from '../../utils/platformHelpers'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import {
  SPACING,
  TYPOGRAPHY,
  CARD_SURFACE,
  PROFILE_CHART_ACCENT,
  STORE_COLORS,
} from '../../constants/layout'

const CARD_IMAGE_ASPECT = 5 / 7

export interface PortfolioCardTileProps {
  title: string
  setName?: string
  cardNumber?: string
  metaLine?: string
  condition?: string
  finishLabel?: string
  quantity?: number
  /** Label before count, e.g. "Qty" or "For sale" */
  quantityCaption?: string
  price: string
  priceChangeZar?: number | null
  priceChangePercent?: number | null
  image?: ImageSourcePropType | null
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  footer?: React.ReactNode
}

function formatCondition(raw?: string): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim().replace(/_/g, ' ')
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

const CONDITION_SHORT: Record<string, string> = {
  'Near Mint': 'NM',
  'Lightly Played': 'LP',
  'Moderately Played': 'MP',
  'Heavily Played': 'HP',
  Damaged: 'DMG',
}

function formatConditionShort(raw?: string): string | null {
  const full = formatCondition(raw)
  if (!full) return null
  return CONDITION_SHORT[full] ?? full
}

function formatChangePercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '0.00'
  return Math.abs(value).toFixed(2)
}

export function PortfolioCardTile({
  title,
  setName,
  cardNumber,
  metaLine,
  condition,
  finishLabel,
  quantity = 1,
  quantityCaption = 'Qty',
  price,
  priceChangeZar,
  priceChangePercent,
  image,
  onPress,
  style,
  footer,
}: PortfolioCardTileProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const conditionLabel = formatConditionShort(condition)
  const showChange =
    priceChangeZar != null &&
    priceChangePercent != null &&
    Number.isFinite(priceChangeZar) &&
    Number.isFinite(priceChangePercent) &&
    Math.abs(priceChangeZar) > 0
  const changeUp = (priceChangeZar ?? 0) >= 0
  const qtyLabel = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 1

  const hasSetMeta = Boolean(setName || cardNumber || conditionLabel || metaLine || finishLabel)
  const displayPrice = price.replace(/\s+ZAR$/i, '').trim()

  const content = (
    <View style={styles.column}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.25)" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        {/* Row 1: name + price */}
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <View style={styles.priceCol}>
            <Text style={styles.price} numberOfLines={1} ellipsizeMode="tail">
              {displayPrice}
            </Text>
            {showChange ? (
              <View style={styles.changeRow}>
                <Ionicons
                  name={changeUp ? 'caret-up' : 'caret-down'}
                  size={11}
                  color={changeUp ? PROFILE_CHART_ACCENT : STORE_COLORS.unverified}
                  style={styles.trendIcon}
                />
                <Text style={styles.change} numberOfLines={1} ellipsizeMode="tail">
                  R{Math.abs(priceChangeZar!).toLocaleString('en-ZA')} ({formatChangePercent(priceChangePercent)}%)
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Row 2: set / number / condition (left) · qty (right, fixed width) */}
        <View style={styles.row}>
          {hasSetMeta ? (
            <Text style={styles.metaSetLine} numberOfLines={1} ellipsizeMode="tail">
              {setName ? <Text style={styles.metaSetText}>{setName}</Text> : null}
              {cardNumber ? (
                <Text style={styles.metaSetText}>{setName ? ` · #${cardNumber}` : `#${cardNumber}`}</Text>
              ) : null}
              {conditionLabel ? (
                <Text style={styles.metaSetAccent}>
                  {setName || cardNumber ? ` · ${conditionLabel}` : conditionLabel}
                </Text>
              ) : null}
              {metaLine ? (
                <Text style={styles.metaSetText}>
                  {setName || cardNumber || conditionLabel ? ` · ${metaLine}` : metaLine}
                </Text>
              ) : finishLabel ? (
                <Text style={styles.metaSetText}>
                  {setName || cardNumber || conditionLabel ? ` · ${finishLabel}` : finishLabel}
                </Text>
              ) : null}
            </Text>
          ) : (
            <View style={styles.metaSetSpacer} />
          )}
          <Text style={styles.metaQty} numberOfLines={1}>
            {quantityCaption}: {qtyLabel}
          </Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={[styles.card, style]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  )
}

function getStyles(theme: { regularFont?: string; boldFont?: string; semiBoldFont?: string }) {
  const label = { fontSize: TYPOGRAPHY.label, lineHeight: TYPOGRAPHY.label, ...androidLabelStyle }
  const caption = { fontSize: TYPOGRAPHY.caption, lineHeight: TYPOGRAPHY.caption, ...androidLabelStyle }

  return StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: CARD_SURFACE.background,
      borderWidth: 1,
      borderColor: CARD_SURFACE.border,
      borderRadius: 0,
    },
    pressable: {
      width: '100%',
    },
    column: {
      width: '100%',
    },
    pressed: {
      opacity: 0.92,
    },
    imageContainer: {
      width: '100%',
      aspectRatio: CARD_IMAGE_ASPECT,
      paddingHorizontal: SPACING.xs,
      paddingTop: SPACING.xs,
      paddingBottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      paddingHorizontal: SPACING.xs,
      paddingTop: SPACING.xs / 2,
      paddingBottom: 0,
      gap: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.xs,
    },
    title: {
      flex: 1,
      minWidth: 0,
      maxWidth: '42%',
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.boldFont,
      fontWeight: '700',
      color: CARD_SURFACE.textPrimary,
      lineHeight: TYPOGRAPHY.bodySmall,
      ...androidLabelStyle,
    },
    priceCol: {
      flexShrink: 0,
      minWidth: 76,
      maxWidth: '58%',
      alignItems: 'flex-end',
    },
    price: {
      fontFamily: theme.boldFont,
      fontWeight: '700',
      color: CARD_SURFACE.textPrimary,
      textAlign: 'right',
      ...caption,
    },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 1,
      maxWidth: '100%',
    },
    trendIcon: {
      width: 12,
      marginRight: 2,
      flexShrink: 0,
    },
    change: {
      flexShrink: 1,
      minWidth: 0,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      textAlign: 'right',
      ...label,
    },
    metaSetLine: {
      flex: 1,
      minWidth: 0,
      marginRight: SPACING.xs / 2,
      ...label,
    },
    metaSetSpacer: {
      flex: 1,
      minWidth: 0,
    },
    metaSetText: {
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textSecondary,
      ...label,
    },
    metaSetAccent: {
      fontFamily: theme.semiBoldFont,
      fontWeight: '600',
      color: PROFILE_CHART_ACCENT,
      ...label,
    },
    metaQty: {
      flexShrink: 0,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      textAlign: 'right',
      ...label,
    },
    footer: {
      paddingHorizontal: SPACING.xs,
      paddingTop: SPACING.xs / 2,
      paddingBottom: SPACING.xs / 2,
    },
  })
}
