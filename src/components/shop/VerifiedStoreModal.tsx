import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface VerifiedStoreModalProps {
  visible: boolean
  onClose: () => void
  onPurchase: () => void
}

interface Benefit {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
}

const benefits: Benefit[] = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified Badge',
    description: 'Display a verified shield badge on your profile to build trust with customers',
  },
  {
    icon: 'trending-up-outline',
    title: 'Enhanced Visibility',
    description: 'Your store appears in the verified stores carousel and gets priority placement',
  },
  {
    icon: 'star-outline',
    title: 'Premium Features',
    description: 'Access to advanced analytics, promotional tools, and exclusive features',
  },
  {
    icon: 'people-outline',
    title: 'Customer Trust',
    description: 'Verified stores receive more views and higher conversion rates',
  },
  {
    icon: 'headset-outline',
    title: 'Priority Support',
    description: 'Get faster response times and dedicated support for your store',
  },
  {
    icon: 'images-outline',
    title: 'Custom Shop Banner',
    description: 'Customize your shop with a personalized banner to showcase your brand',
  },
]

export function VerifiedStoreModal({
  visible,
  onClose,
  onPurchase,
}: VerifiedStoreModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

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
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Become a Verified Shop</Text>
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
            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.descriptionText}>
                By purchasing a verified store, you'll receive:
              </Text>
              <View style={styles.benefitsContainer}>
                {benefits.map((benefit, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.benefitBlock,
                      index === benefits.length - 1 && { marginBottom: 0 }
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={theme.tintColor || '#10B981'}
                      style={styles.checkIcon}
                    />
                    <Text style={styles.benefitText}>{benefit.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Footer Button */}
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={onPurchase}
              activeOpacity={0.8}
            >
              <Text style={styles.verifyButtonText}>Verify Now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
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
    scrollContent: {
      flexGrow: 1,
      paddingBottom: SPACING.xs,
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
      flex: 1,
    },
    closeButton: {
      padding: SPACING.xs,
      marginLeft: SPACING.sm,
    },
    content: {
      marginBottom: SPACING.md,
    },
    descriptionText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.8)',
      marginBottom: SPACING.lg,
      lineHeight: TYPOGRAPHY.body * 1.4,
    },
    benefitsContainer: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    benefitBlock: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    checkIcon: {
      marginRight: SPACING.sm,
      marginTop: 2,
    },
    benefitText: {
      flex: 1,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.7)',
      lineHeight: TYPOGRAPHY.body * 1.4,
    },
    verifyButton: {
      backgroundColor: theme.tintColor || '#10B981',
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.lg,
    },
    verifyButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor || theme.textColor || '#FFFFFF',
      fontWeight: '600',
    },
  })
