import { View, StyleSheet, TouchableOpacity, Image, type ViewStyle } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { VaultingBadge } from './VaultingBadge'
import { AppButton } from '../ui/AppButton'

type VaultingStatus = 'vaulted' | 'seller-has' | 'unverified' | 'vaulting-in-process'
type PurchaseType = 'instant' | 'bid' | 'both'

interface ListingCardProps {
  id: string
  cardImage?: any
  cardName: string
  price: number
  vaultingStatus: VaultingStatus
  purchaseType: PurchaseType
  currentBid?: number
  bidCount?: number
  onPress?: () => void
  onBuyPress?: () => void
  onBidPress?: () => void
  isOwnListing?: boolean
  onEditPress?: () => void
  /** Precise width for 2-column grids (avoids 48% + gap overflow on Android). */
  cardWidth?: number
}

export function ListingCard({
  cardImage,
  cardName,
  price,
  vaultingStatus,
  purchaseType,
  currentBid,
  bidCount = 0,
  onPress,
  onBuyPress,
  onBidPress,
  isOwnListing = false,
  onEditPress,
  cardWidth,
}: ListingCardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const containerStyle: ViewStyle[] = [styles.cardContainer]
  if (cardWidth != null) {
    containerStyle.push({ width: cardWidth, maxWidth: cardWidth })
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Card className="p-0 gap-0 border-0 shadow-none" style={styles.card}>
        <CardContent className="p-0" style={styles.cardContent}>
          {/* Image Section */}
          <View style={styles.imageContainer}>
            {cardImage ? (
              <Image
                source={cardImage}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color="rgba(255, 255, 255, 0.3)"
                />
              </View>
            )}
            {!isOwnListing && (
              <View style={styles.badgeContainer}>
                <VaultingBadge status={vaultingStatus} size="sm" />
              </View>
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.cardName} numberOfLines={1} ellipsizeMode="tail" textAlign="left">
              {cardName}
            </Text>

            {/* Always show bid info if there's a current bid, otherwise show price */}
            {currentBid ? (
              <View style={styles.bidInfo}>
                <Text style={styles.bidLabel}>
                  Bid: R{Number(currentBid).toLocaleString('en-ZA')}
                </Text>
                {bidCount > 0 && (
                  <Text style={styles.bidCount}>{bidCount} bids</Text>
                )}
              </View>
            ) : (
              <Text style={styles.price}>R{Number(price).toLocaleString('en-ZA')}</Text>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {isOwnListing ? (
                <View style={styles.ownListingActions}>
                  <AppButton
                    variant="outline"
                    size="sm"
                    onDarkSurface
                    icon="pencil-outline"
                    label="Edit"
                    fullWidth
                    onPress={onEditPress}
                  />
                  <View style={[styles.badgeBelowEdit, styles.ownListingActionSpaced]}>
                    <VaultingBadge status={vaultingStatus} size="sm" muted textOnly />
                  </View>
                </View>
              ) : (
                <>
                  {purchaseType === 'instant' || purchaseType === 'both' ? (
                    <AppButton
                      variant="accent"
                      size="sm"
                      icon="cart-outline"
                      label={`Buy R${Number(price).toLocaleString('en-ZA')}`}
                      fullWidth
                      onPress={onBuyPress}
                    />
                  ) : null}
                  <AppButton
                    variant="accent"
                    size="sm"
                    icon="hammer-outline"
                    label="Bid"
                    fullWidth
                    onPress={onBidPress}
                    style={
                      (purchaseType === 'instant' || purchaseType === 'both')
                        ? styles.actionButtonSpaced
                        : undefined
                    }
                  />
                </>
              )}
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  cardContainer: {
    width: '48%',
    flexGrow: 0,
    flexShrink: 1,
  },
  card: {
    backgroundColor: theme.cardBackground || '#0a0a0a',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  infoSection: {
    padding: SPACING.xs,
    paddingTop: 4,
  },
  cardName: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'left',
    lineHeight: 16,
  },
  price: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  bidInfo: {
    marginBottom: SPACING.sm,
  },
  bidLabel: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  bidCount: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  actionsContainer: {},
  actionButtonSpaced: {
    marginTop: SPACING.sm,
  },
  ownListingActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
  },
  ownListingActionSpaced: {
    marginTop: SPACING.sm,
  },
  badgeBelowEdit: {
    alignItems: 'center',
  },
})
