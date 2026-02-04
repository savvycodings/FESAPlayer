import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { Card, CardContent } from '../ui/card'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'

export interface Order {
  id: string
  itemName: string
  itemImage?: any
  price: number
  quantity: number
  orderDate: string
  status: OrderStatus
  orderNumber: string
}

interface OrderCardProps {
  order: Order
  onPress?: () => void
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

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

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
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
                <View style={styles.detailItem}>
                  <Ionicons name="receipt-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.detailText}>#{order.orderNumber}</Text>
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
                <Text style={styles.priceText}>${order.price.toFixed(2)}</Text>
              </View>
            </View>
          </View>
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
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
})
