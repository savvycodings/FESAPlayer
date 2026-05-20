import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Text as RNText,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useContext } from 'react'
import { androidLabelStyle } from '../../utils/platformHelpers'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import {
  SPACING,
  TYPOGRAPHY,
  CARD_SURFACE,
  PROFILE_CHART_ACCENT,
  STORE_COLORS,
  LISTING_CARD_IMAGE_INSET_H,
} from '../../constants/layout'

const CARD_IMAGE_ASPECT = 5 / 7
/** Horizontal inset for title / price / meta (keeps text off the card border) */
const TILE_TEXT_PAD_H = SPACING.sm
/** Art width inside tile — height follows aspect ratio (avoids empty bands above/below) */
const TILE_IMAGE_WIDTH = '94%'

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
  relaxedBottom?: boolean
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
  if (value == null || !Number.isFinite(value)) return '0.0'
  return Math.abs(value).toFixed(1)
}

function formatCompactZar(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 10000) return `R${Math.round(abs / 1000)}k`
  if (abs >= 1000) return `R${(abs / 1000).toFixed(1)}k`
  return `R${abs.toLocaleString('en-ZA')}`
}

function buildSetLine(
  setName?: string,
  metaLine?: string,
  finishLabel?: string
): string {
  const parts: string[] = []
  if (setName?.trim()) parts.push(setName.trim())
  if (metaLine?.trim()) parts.push(metaLine.trim())
  else if (finishLabel?.trim()) parts.push(finishLabel.trim())
  return parts.join(' · ')
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
  relaxedBottom = false,
}: PortfolioCardTileProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, Boolean(footer))
  const conditionLabel = formatConditionShort(condition)
  const showChange =
    priceChangeZar != null &&
    priceChangePercent != null &&
    Number.isFinite(priceChangeZar) &&
    Number.isFinite(priceChangePercent) &&
    Math.abs(priceChangeZar) > 0
  const changeUp = (priceChangeZar ?? 0) >= 0
  const qtyLabel = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 1
  const extraMetaLine = buildSetLine(undefined, metaLine, finishLabel)
  const displayPrice = price.replace(/\s+ZAR$/i, '').trim()
  const numberLabel = cardNumber?.trim() ? `#${cardNumber.trim()}` : null
  const setOnly = setName?.trim() || ''
  const showHeaderRight = Boolean(numberLabel || setOnly)

  const content = (
    <View style={styles.column}>
      <View style={styles.header}>
        <RNText style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </RNText>
        {showHeaderRight ? (
          <View style={styles.headerRight}>
            {numberLabel ? (
              <RNText style={styles.cardNumber} numberOfLines={1}>
                {numberLabel}
              </RNText>
            ) : null}
            {setOnly ? (
              <RNText style={styles.headerSetName} numberOfLines={1} ellipsizeMode="tail">
                {setOnly}
              </RNText>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.imageContainer}>
        <View style={styles.imageInner}>
          {image ? (
            <Image source={image} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.25)" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.priceRow}>
          <View style={styles.priceCol}>
            <RNText style={styles.price} numberOfLines={1} ellipsizeMode="tail">
              {displayPrice}
            </RNText>
            {showChange ? (
              <View style={styles.changeRow}>
                <Ionicons
                  name={changeUp ? 'caret-up' : 'caret-down'}
                  size={10}
                  color={changeUp ? PROFILE_CHART_ACCENT : STORE_COLORS.unverified}
                  style={styles.trendIcon}
                />
                <RNText style={styles.change} numberOfLines={1} ellipsizeMode="tail">
                  {formatCompactZar(priceChangeZar!)} ({formatChangePercent(priceChangePercent)}%)
                </RNText>
              </View>
            ) : null}
          </View>
          <View style={styles.qtyCol}>
            <RNText style={styles.qty} numberOfLines={1} ellipsizeMode="tail">
              {quantityCaption}: {qtyLabel}
            </RNText>
            {conditionLabel ? (
              <RNText style={styles.condition} numberOfLines={1}>
                {conditionLabel}
              </RNText>
            ) : null}
          </View>
        </View>

        {extraMetaLine ? (
          <RNText style={styles.metaExtra} numberOfLines={1} ellipsizeMode="tail">
            {extraMetaLine}
          </RNText>
        ) : null}
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

function getStyles(
  theme: { regularFont?: string; boldFont?: string; semiBoldFont?: string },
  hasFooter: boolean
) {
  const labelSize = TYPOGRAPHY.label
  const captionSize = TYPOGRAPHY.caption

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
      gap: 2,
    },
    pressed: {
      opacity: 0.92,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.xs,
      paddingHorizontal: TILE_TEXT_PAD_H,
      paddingTop: TILE_TEXT_PAD_H,
      paddingBottom: 2,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: captionSize,
      lineHeight: captionSize + 1,
      fontFamily: theme.boldFont,
      fontWeight: '700',
      color: CARD_SURFACE.textPrimary,
      ...androidLabelStyle,
    },
    headerRight: {
      flexShrink: 0,
      maxWidth: '48%',
      alignItems: 'flex-end',
      gap: 1,
    },
    cardNumber: {
      fontSize: labelSize,
      lineHeight: labelSize + 2,
      fontFamily: theme.semiBoldFont,
      fontWeight: '600',
      color: CARD_SURFACE.textSecondary,
      textAlign: 'right',
      ...androidLabelStyle,
    },
    headerSetName: {
      fontSize: labelSize,
      lineHeight: labelSize + 2,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      textAlign: 'right',
      ...androidLabelStyle,
    },
    imageContainer: {
      width: '100%',
      paddingHorizontal: LISTING_CARD_IMAGE_INSET_H,
      paddingVertical: 0,
      alignItems: 'center',
      overflow: 'hidden',
    },
    imageInner: {
      width: TILE_IMAGE_WIDTH,
      aspectRatio: CARD_IMAGE_ASPECT,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      aspectRatio: CARD_IMAGE_ASPECT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      paddingHorizontal: TILE_TEXT_PAD_H,
      paddingTop: 2,
      /** Only pad under text when there is no button footer (footer owns bottom inset) */
      paddingBottom: hasFooter ? 0 : TILE_TEXT_PAD_H,
      gap: 2,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.xs,
      width: '100%',
    },
    priceCol: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    qtyCol: {
      flexShrink: 0,
      alignItems: 'flex-end',
      gap: 1,
      maxWidth: '46%',
    },
    metaExtra: {
      fontSize: labelSize,
      lineHeight: labelSize + 2,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textSecondary,
      ...androidLabelStyle,
    },
    qty: {
      flexShrink: 0,
      fontSize: labelSize,
      lineHeight: labelSize + 2,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      textAlign: 'right',
      ...androidLabelStyle,
    },
    price: {
      flex: 1,
      minWidth: 0,
      fontSize: captionSize,
      lineHeight: captionSize + 2,
      fontFamily: theme.boldFont,
      fontWeight: '700',
      color: CARD_SURFACE.textPrimary,
      ...androidLabelStyle,
    },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      maxWidth: '100%',
    },
    trendIcon: {
      width: 10,
      marginRight: 2,
      flexShrink: 0,
    },
    change: {
      flexShrink: 1,
      fontSize: labelSize,
      lineHeight: labelSize + 2,
      fontFamily: theme.regularFont,
      color: CARD_SURFACE.textMuted,
      ...androidLabelStyle,
    },
    condition: {
      fontSize: labelSize,
      lineHeight: labelSize + 2,
      fontFamily: theme.semiBoldFont,
      fontWeight: '600',
      color: PROFILE_CHART_ACCENT,
      textAlign: 'right',
      ...androidLabelStyle,
    },
    footer: {
      paddingHorizontal: TILE_TEXT_PAD_H,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
  })
}
