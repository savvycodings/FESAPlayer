import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { Card, CardContent } from '../ui/card'
import { PortfolioGraph } from './PortfolioGraph'

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface ProductModalProps {
  visible: boolean
  productName: string
  productImage?: any
  productPrice?: string
  onClose: () => void
}

export function ProductModal({
  visible,
  productName,
  productImage,
  productPrice,
  onClose,
}: ProductModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const tintColor = theme.tintColor || '#73EC8B'

  // Parse price for calculations
  const numericPrice = productPrice ? parseFloat(productPrice.replace(/[^0-9.]/g, '')) : 150

  // Price history data for the last 7 days
  const priceHistoryData = [
    { x: 0, y: numericPrice - 5 },
    { x: 1, y: numericPrice - 3 },
    { x: 2, y: numericPrice - 2 },
    { x: 3, y: numericPrice - 1 },
    { x: 4, y: numericPrice + 1 },
    { x: 5, y: numericPrice + 2 },
    { x: 6, y: numericPrice },
  ]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{productName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {/* Product Image */}
            {productImage && (
              <Card style={styles.imageCard}>
                <CardContent style={styles.imageCardContent}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={productImage}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Price Information */}
            <Card style={styles.priceCard}>
              <CardContent style={styles.priceCardContent}>
                <View style={styles.priceContainer}>
                  <View style={styles.priceIconContainer}>
                    <Ionicons name="cash-outline" size={20} color={tintColor} />
                  </View>
                  <View style={styles.priceTextContainer}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <Text style={styles.priceText}>
                      {productPrice || `$${numericPrice.toFixed(2)}`}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Price History Graph */}
            <PortfolioGraph
              data={priceHistoryData}
              height={140}
              color={tintColor}
              title="Price History"
              subtitle="Last 7 days"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: theme.backgroundColor,
    borderRadius: RADIUS.lg,
    width: '85%',
    maxWidth: 400,
    maxHeight: '85%',
    padding: SPACING.containerPadding,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xs,
  },
  imageCard: {
    marginBottom: SPACING.md,
    backgroundColor: theme.cardBackground || '#000000',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  imageCardContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.cardBackground || '#000000',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  priceCard: {
    marginBottom: SPACING.md,
    backgroundColor: theme.cardBackground || '#000000',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  priceCardContent: {
    padding: SPACING.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  priceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: theme.tintColor 
      ? hexToRgba(theme.tintColor, 0.1)
      : 'rgba(115, 236, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceTextContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  priceText: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#73EC8B',
    fontWeight: '600',
  },
})
