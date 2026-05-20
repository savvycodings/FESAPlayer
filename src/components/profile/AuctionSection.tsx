import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Carousel } from '../Carousel'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { AppButton } from '../ui/AppButton'

export interface Auction {
  id: string
  title: string
  description: string
  startTime?: Date
  status: 'starting' | 'live' | 'ending'
  timeRemaining?: string
  currentBid?: number
  bidCount?: number
  image?: any
}

interface AuctionSectionProps {
  auctions?: Auction[]
  onCreateAuction?: () => void
  onAuctionPress?: (auction: Auction) => void
  showCreateButton?: boolean
}

export function AuctionSection({
  auctions = [],
  onCreateAuction,
  onAuctionPress,
  showCreateButton = true,
}: AuctionSectionProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  // Default empty state auction for "Create Auction" card
  const createAuctionItem = {
    id: 'create',
    title: 'Create New Auction',
    description: 'Sell cards on your terms.',
    status: 'starting' as const,
    buttonText: 'Create Auction',
  }

  const displayAuctions = showCreateButton && auctions.length === 0 
    ? [createAuctionItem as Auction]
    : showCreateButton && auctions.length > 0
    ? [createAuctionItem as Auction, ...auctions]
    : auctions

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return theme.tintColor || '#73EC8B'
      case 'ending':
        return '#DC2626'
      case 'starting':
        return '#0281ff'
      default:
        return theme.tintColor || '#73EC8B'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live':
        return 'LIVE'
      case 'ending':
        return 'ENDING SOON'
      case 'starting':
        return 'STARTING SOON'
      default:
        return 'LIVE'
    }
  }

  return (
    <Carousel
      items={displayAuctions}
      renderItem={(item, index) => {
        const isCreateCard = item.id === 'create'
        const statusColor = isCreateCard
          ? (theme.buttonFilledBg || '#FFFFFF')
          : getStatusColor(item.status)
        
        return (
          <TouchableOpacity
            key={item.id || `auction-${index}`}
            style={[styles.auctionCard, { borderColor: statusColor }]}
            onPress={() => {
              if (isCreateCard && onCreateAuction) {
                onCreateAuction()
              } else if (onAuctionPress) {
                onAuctionPress(item)
              }
            }}
            activeOpacity={0.8}
          >
            {item.image && (
              <Image
                source={item.image}
                style={styles.auctionBackgroundImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.auctionContent}>
              <View style={styles.auctionTopContent}>
                {!isCreateCard && (
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                  </View>
                )}
                {isCreateCard && (
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Ionicons name="add-circle-outline" size={14} color={theme.buttonFilledFg || '#000000'} />
                  </View>
                )}
                <Text style={styles.auctionTitle}>{item.title}</Text>
                {!isCreateCard && item.timeRemaining && (
                  <Text style={styles.timeRemaining}>
                    <Ionicons name="time-outline" size={12} color={theme.mutedForegroundColor} />{' '}
                    {item.timeRemaining}
                  </Text>
                )}
              </View>
              <View style={styles.auctionBottomContent}>
                <View style={styles.auctionLeftContent}>
                  <Text style={styles.auctionDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  {!isCreateCard && (item.currentBid || item.bidCount !== undefined) && (
                    <View style={styles.bidInfo}>
                      {item.currentBid && (
                        <Text style={styles.currentBid}>
                          R{Number(item.currentBid).toLocaleString('en-ZA')}
                          {item.bidCount !== undefined && ` • ${item.bidCount} bid${item.bidCount !== 1 ? 's' : ''}`}
                        </Text>
                      )}
                    </View>
                  )}
                  <AppButton
                    variant={isCreateCard ? 'filled' : 'outline'}
                    size="sm"
                    icon={isCreateCard ? 'add-circle-outline' : 'gift-outline'}
                    label={isCreateCard ? 'Create Auction' : 'View Auction'}
                    onPress={() => {
                      if (isCreateCard && onCreateAuction) {
                        onCreateAuction()
                      } else if (onAuctionPress) {
                        onAuctionPress(item)
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )
      }}
      itemWidth={360}
      itemHeight={200}
      itemSpacing={8}
    />
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  auctionCard: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.md,
    justifyContent: 'space-between',
    borderWidth: 2,
    backgroundColor: theme.cardBackground || '#000000',
    position: 'relative',
  },
  auctionBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  auctionContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  auctionTopContent: {
    width: '100%',
    marginBottom: 8,
    flexShrink: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.boldFont,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  auctionTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
    width: '100%',
    marginBottom: 4,
  },
  timeRemaining: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  auctionBottomContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    minHeight: 0,
  },
  auctionLeftContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  auctionDescription: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    flexShrink: 1,
  },
  bidInfo: {
    marginBottom: 0,
  },
  currentBid: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  auctionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    minWidth: 0,
    flexShrink: 1,
  },
  buttonIcon: {
    marginRight: 6,
  },
  auctionButtonText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
})
