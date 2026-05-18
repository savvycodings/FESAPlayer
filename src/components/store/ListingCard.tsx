import { View, StyleSheet, TouchableOpacity, Image, type ViewStyle } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { VaultingBadge } from './VaultingBadge'

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
                // Edit button then vaulting badge below, centered
                <View style={styles.ownListingActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={onEditPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={14}
                      color={theme.tintTextColor || '#000000'}
                      style={styles.editIcon}
                    />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <View style={[styles.badgeBelowEdit, styles.ownListingActionSpaced]}>
                    <VaultingBadge status={vaultingStatus} size="sm" muted textOnly />
                  </View>
                </View>
              ) : (
                // Show Buy/Bid buttons for other users' listings
                <>
                  {purchaseType === 'instant' || purchaseType === 'both' ? (
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={onBuyPress}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.buyButtonText} numberOfLines={1}>
                        Buy Now R{Number(price).toLocaleString('en-ZA')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[
                      styles.bidButton,
                      (purchaseType === 'instant' || purchaseType === 'both') && styles.actionButtonSpaced,
                    ]}
                    onPress={onBidPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.bidButtonText}>Bid</Text>
                  </TouchableOpacity>
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
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  cardName: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'left',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  price: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  bidInfo: {
    marginBottom: SPACING.sm,
  },
  bidLabel: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
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
  buyButton: {
    backgroundColor: theme.tintColor || '#73EC8B',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  buyButtonText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
  },
  bidButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bidButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: theme.tintColor || '#73EC8B',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  editIcon: {
    marginRight: 6,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.tintTextColor || '#000000',
    fontWeight: '600',
  },
})
