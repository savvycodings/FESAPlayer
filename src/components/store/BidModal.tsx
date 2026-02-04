import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { useContext, useState } from 'react'
import { Text } from '../ui/text'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface Bid {
  id: string
  userId: string
  amount: number
  createdAt: Date
}

interface BidModalProps {
  visible: boolean
  cardName: string
  currentPrice: number
  currentBid?: number
  bids?: Bid[]
  onClose: () => void
  onPlaceBid: (amount: number) => void
}

export function BidModal({
  visible,
  cardName,
  currentPrice,
  currentBid,
  bids = [],
  onClose,
  onPlaceBid,
}: BidModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [bidAmount, setBidAmount] = useState('')

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount)
    if (amount > (currentBid || currentPrice)) {
      onPlaceBid(amount)
      setBidAmount('')
    }
  }

  const minBid = (currentBid || currentPrice) + 1

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Place a Bid</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.cardName}>{cardName}</Text>

            <View style={styles.priceInfo}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Starting Price:</Text>
                <Text style={styles.priceValue}>${currentPrice}</Text>
              </View>
              {currentBid && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Current Bid:</Text>
                  <Text style={styles.priceValue}>${currentBid}</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Minimum Bid:</Text>
                <Text style={styles.priceValue}>${minBid}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Bid Amount</Text>
              <Input
                placeholder={`$${minBid} or higher`}
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            {bids.length > 0 && (
              <View style={styles.bidHistory}>
                <Text style={styles.bidHistoryTitle}>Bid History</Text>
                {bids.slice(0, 5).map((bid) => (
                  <View key={bid.id} style={styles.bidItem}>
                    <Text style={styles.bidAmount}>${bid.amount}</Text>
                    <Text style={styles.bidDate}>
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Button
              onPress={handlePlaceBid}
              disabled={!bidAmount || parseFloat(bidAmount) < minBid}
              style={styles.bidButton}
            >
              <Text style={styles.bidButtonText}>Place Bid</Text>
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.backgroundColor,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
    padding: SPACING.containerPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  cardName: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
  priceInfo: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  priceValue: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  input: {
    marginBottom: 0,
  },
  bidHistory: {
    marginBottom: SPACING.lg,
  },
  bidHistoryTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  bidAmount: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
  bidDate: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  bidButton: {
    marginTop: SPACING.md,
  },
  bidButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
  },
})
