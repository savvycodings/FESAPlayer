import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext, useState } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'

export type TrackingStatus = 'order_placed' | 'deposited' | 'in_transit' | 'delivered'

export interface Order {
  id: string
  itemName: string
  itemImage?: any
  price: number
  quantity: number
  orderDate: string
  status: OrderStatus
  orderNumber: string
  shippingFeeZar?: number
  trackingStatus?: TrackingStatus
}

interface OrderCardProps {
  order: Order
  onPress?: () => void
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [expanded, setExpanded] = useState(false)

  const trackingSteps: { key: TrackingStatus; label: string }[] = [
    { key: 'order_placed', label: 'Order placed' },
    { key: 'deposited', label: 'Deposited' },
    { key: 'in_transit', label: 'In transit' },
    { key: 'delivered', label: 'Delivered' },
  ]
  const currentTracking = order.trackingStatus || (order.status === 'completed' ? 'delivered' : 'deposited')
  const currentIndex = Math.max(0, trackingSteps.findIndex(s => s.key === currentTracking))

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return theme.tintColor || '#73EC8B'
      case 'shipped':
        return theme.tintColor || '#73EC8B'
      case 'delivered':
      case 'completed':
        return 'rgba(255, 255, 255, 0.6)'
      case 'cancelled':
        return '#EF4444'
      default:
        return 'rgba(255, 255, 255, 0.6)'
    }
  }

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'processing':
        return 'Processing'
      case 'shipped':
        return 'Shipped'
      case 'delivered':
        return 'Delivered'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const isOngoing = order.status !== 'completed' && order.status !== 'cancelled'

  const handlePress = () => {
    setExpanded(!expanded)
    onPress?.()
  }

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <View style={styles.contentRow}>
            {/* Image Section */}
            <View style={styles.imageContainer}>
              {order.itemImage ? (
                <Image
                  source={order.itemImage}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color="rgba(255, 255, 255, 0.3)"
                  />
                </View>
              )}
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.headerRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {order.itemName}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={[styles.detailItem, styles.orderNumberWrap]}>
                  <Ionicons name="receipt-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.orderNumberText} numberOfLines={1} ellipsizeMode="tail">
                    #{order.orderNumber}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.detailText}>{order.orderDate}</Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.quantityText}>Qty: {order.quantity}</Text>
                </View>
                <Text style={styles.priceText}>R{order.price.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {expanded && (
            <View style={styles.expandedSection}>
              <View style={styles.shippingDivider} />
              <Text style={styles.sectionLabel}>Shipping & tracking</Text>
              {trackingSteps.map((step, i) => (
                <View key={step.key} style={styles.trackingStep}>
                  <View style={[styles.trackingDot, i <= currentIndex && styles.trackingDotActive]} />
                  <Text style={[styles.trackingLabel, i <= currentIndex && styles.trackingLabelActive]}>{step.label}</Text>
                </View>
              ))}
              {order.shippingFeeZar != null && order.shippingFeeZar > 0 && (
                <Text style={styles.shippingFeeText}>Shipping: R{order.shippingFeeZar.toFixed(2)}</Text>
              )}
            </View>
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  cardContainer: {
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: SPACING.cardPadding,
  },
  contentRow: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: theme.cardBackground || '#000000',
    overflow: 'hidden',
    marginRight: SPACING.md,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemName: {
    flex: 1,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  orderNumberWrap: {
    flex: 1,
    minWidth: 0,
  },
  orderNumberText: {
    fontSize: TYPOGRAPHY.label,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
  },
  detailText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  priceText: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  shippingDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.sm,
  },
  trackingRow: {
    marginBottom: SPACING.sm,
  },
  trackingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: SPACING.sm,
  },
  trackingDotActive: {
    backgroundColor: theme.tintColor || '#73EC8B',
  },
  trackingLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.4)',
    flex: 1,
  },
  trackingLabelActive: {
    color: theme.textColor,
    fontFamily: theme.semiBoldFont,
  },
  shippingFeeText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
})
