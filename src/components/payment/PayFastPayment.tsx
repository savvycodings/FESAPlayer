import { View, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Linking, Alert, Platform } from 'react-native'
import { useContext, useState, useEffect, useRef } from 'react'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

// Backend API URL - Automatically detects correct URL for platform
const getBackendUrl = () => {
  // Check environment variable first
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL
  }
  
  // For web, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3050'
  }
  
  // For mobile (Expo Go), use the development machine's IP
  // This is usually shown in the Expo Dev Tools or Metro bundler
  // Replace with your actual local IP address (e.g., 192.168.1.100)
  // You can find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
  try {
    const devIp = Constants.expoConfig?.extra?.backendIp || '192.168.1.9' // Default, update this
    return `http://${devIp}:3050`
  } catch (error) {
    // Fallback if Constants is not available
    console.warn('Could not get backend IP from Constants, using default:', error)
    return 'http://192.168.1.9:3050'
  }
}

interface PayFastPaymentProps {
  visible: boolean
  amount: number
  itemName: string
  itemDescription?: string
  userEmail?: string
  userNameFirst?: string
  userNameLast?: string
  cellNumber?: string
  listingId?: number | string
  buyerId?: number | string // Better Auth uses string IDs
  sellerId?: number | string // Better Auth uses string IDs
  onClose: () => void
  onSuccess: (paymentData: any) => void
  onCancel: () => void
  onError?: (error: string) => void
}

export function PayFastPayment({
  visible,
  amount,
  itemName,
  itemDescription,
  userEmail,
  userNameFirst,
  userNameLast,
  cellNumber,
  listingId,
  buyerId,
  sellerId,
  onClose,
  onSuccess,
  onCancel,
  onError,
}: PayFastPaymentProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  // Use ref to persist payment ID even if component state resets
  const paymentIdRef = useRef<string | null>(null)
  // Track if status check is already running to prevent multiple polls
  const statusCheckRunningRef = useRef<boolean>(false)

  // Set up deep link listener (backup for direct deep links)
  useEffect(() => {
    if (visible) {
      // Validate required data before creating payment
      if (!buyerId || !sellerId || !listingId) {
        console.error('❌ [PAYFAST] Missing required IDs:', {
          buyerId,
          sellerId,
          listingId,
        })
        onError?.('Missing payment information. Please try again.')
        onClose()
        return
      }
      createPayment()
    }

    // Listen for deep links as backup (openAuthSessionAsync handles most cases)
    const subscription = Linking.addEventListener('url', handleDeepLink)
    
    return () => {
      subscription.remove()
    }
  }, [visible])

  const handleDeepLink = (event: { url: string }) => {
    const { url } = event
    
    if (url.includes('payment/success') || url.includes('saplayer://payment/success')) {
      WebBrowser.dismissBrowser()
      onSuccess({
        amount,
        itemName,
        paymentId: paymentData?.mPaymentId || `pf_${Date.now()}`,
      })
      onClose()
    } else if (url.includes('payment/cancel') || url.includes('saplayer://payment/cancel')) {
      WebBrowser.dismissBrowser()
      onCancel()
      onClose()
    }
  }

  const checkPaymentStatus = async (paymentIdOverride?: string) => {
    // Use override if provided, otherwise try paymentData, then ref
    const paymentId = paymentIdOverride || paymentData?.mPaymentId || paymentIdRef.current
    
    if (!paymentId) {
      console.log('No payment ID to check')
      onCancel()
      onClose()
      return
    }

    // Prevent multiple status checks from running simultaneously
    if (statusCheckRunningRef.current) {
      console.log('Status check already running, skipping...')
      return
    }

    statusCheckRunningRef.current = true

    try {
      console.log('Checking payment status for:', paymentId)
      
      // Poll for payment status (check multiple times)
      let attempts = 0
      const maxAttempts = 5
      const checkInterval = 2000 // 2 seconds

      const checkStatus = async (): Promise<void> => {
        attempts++
        console.log(`Payment status check attempt ${attempts}/${maxAttempts}`)

        const backendUrl = getBackendUrl()
        const response = await fetch(`${backendUrl}/payment/status/${paymentId}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Payment status response:', data)
          
          if (data.status === 'complete') {
            console.log('✅ Payment verified as complete via status check!')
            // Show success alert
            statusCheckRunningRef.current = false
            Alert.alert(
              'Payment Successful! 🎉',
              `Your payment of R${amount.toFixed(2)} for ${itemName} has been processed successfully.`,
              [{ text: 'OK', onPress: () => {
                onSuccess({
                  amount,
                  itemName,
                  paymentId: paymentId,
                })
                onClose()
              }}]
            )
            return
          } else if (data.status === 'failed') {
            console.log('❌ Payment failed')
            statusCheckRunningRef.current = false
            onCancel()
            onClose()
            return
          } else if (data.status === 'pending' && attempts < maxAttempts) {
            // Still pending, check again
            console.log(`Payment still pending, will check again in ${checkInterval}ms...`)
            setTimeout(checkStatus, checkInterval)
            return
          } else if (attempts >= maxAttempts) {
            // Exhausted attempts while still pending
            console.log('⚠️ Payment status check timeout - payment still pending after', maxAttempts, 'attempts')
            statusCheckRunningRef.current = false
            // Don't assume cancelled - could be processing
            // Show a message or keep checking
            onCancel()
            onClose()
            return
          }
        } else if (response.status === 404) {
          // Payment not found in store - might not have ITN yet
          console.log('Payment not found in status store, will check again...')
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, checkInterval)
            return
          } else {
            console.log('⚠️ Payment not found after', maxAttempts, 'attempts - assuming cancelled')
            onCancel()
            onClose()
            return
          }
        } else {
          // Error response
          console.error('Payment status check error:', response.status, response.statusText)
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, checkInterval)
            return
          } else {
            console.log('⚠️ Payment status check failed after', maxAttempts, 'attempts')
            statusCheckRunningRef.current = false
            onCancel()
            onClose()
            return
          }
        }
      }

      // Start checking after a short delay (give ITN time to process)
      setTimeout(checkStatus, 1000)
    } catch (error) {
      console.error('Payment status check error:', error)
      statusCheckRunningRef.current = false
      // On error, assume cancelled
      onCancel()
      onClose()
    }
  }

  const createPayment = async () => {
    try {
      setLoading(true)
      
      const backendUrl = getBackendUrl()
      console.log('Using backend URL:', backendUrl)
      
      // Log payment data being sent
      console.log('💳 [PAYFAST] Creating payment with data:', {
        amount,
        itemName,
        listingId,
        buyerId,
        sellerId,
        userEmail: userEmail || 'user@example.com',
        listingIdType: typeof listingId,
        buyerIdType: typeof buyerId,
        sellerIdType: typeof sellerId,
      })
      
      // Validate IDs and email are present
      if (!buyerId || !sellerId || !listingId) {
        const missing = []
        if (!buyerId) missing.push('buyerId')
        if (!sellerId) missing.push('sellerId')
        if (!listingId) missing.push('listingId')
        console.error('❌ [PAYFAST] Missing required IDs:', missing)
        throw new Error(`Missing payment information: ${missing.join(', ')}. Please refresh and try again.`)
      }
      
      // Validate email is present and not the fallback
      if (!userEmail || userEmail === 'user@example.com') {
        console.error('❌ [PAYFAST] Invalid or missing user email:', userEmail)
        throw new Error('User email is required for payment. Please ensure you are logged in.')
      }
      
      const response = await fetch(`${backendUrl}/payment/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          itemName,
          itemDescription: itemDescription || itemName,
          userEmail: userEmail || 'user@example.com',
          userNameFirst: userNameFirst || 'User',
          userNameLast: userNameLast || '',
          cellNumber: cellNumber || '',
          listingId,
          buyerId,
          sellerId,
          // Send backend URL so server knows what URL to use for return URLs
          backendUrl: backendUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const data = await response.json()
      
      if (data.success && data.paymentUrl) {
        setPaymentData(data)
        // Store payment ID in ref for persistence
        if (data.mPaymentId) {
          paymentIdRef.current = data.mPaymentId
        }
        // Open PayFast URL directly in browser
        await openPaymentBrowser(data.paymentUrl)
      } else {
        throw new Error('Invalid payment response')
      }
    } catch (error: any) {
      console.error('Payment creation error:', error)
      console.error('Backend URL attempted:', getBackendUrl())
      
      // More helpful error messages
      let errorMessage = 'Failed to initialize payment. Please try again.'
      if (error.message === 'Network request failed') {
        errorMessage = `Cannot connect to backend server.\n\nPlease check:\n1. Backend server is running on port 3050\n2. Your device is on the same network\n3. Backend URL: ${getBackendUrl()}\n\nUpdate backendIp in app.json with your computer's IP address.`
      }
      
      if (onError) {
        onError(errorMessage)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const openPaymentBrowser = async (payfastUrl: string) => {
    try {
      // Open PayFast URL directly in browser
      // Use openAuthSessionAsync to capture return URL redirects
      const result = await WebBrowser.openAuthSessionAsync(
        payfastUrl,
        'saplayer://payment'
      )

      // Handle browser result
      console.log('Browser result:', result)
      
      if (result.type === 'success' && result.url) {
        // Check if URL contains success or cancel
        const url = result.url
        console.log('Payment redirect URL:', url)
        
        // Check for success (deep link or HTTP return URL)
        // Check multiple patterns to catch all variations
        const isSuccess = url.includes('payment/success') || 
            url.includes('status=success') || 
            url.includes('saplayer://payment/success') ||
            url.includes('/payment/return') && url.includes('status=success') ||
            url.includes('payment/return?status=success')
        
        if (isSuccess) {
          console.log('✅ Payment successful! (detected from URL)')
          
          // Extract payment ID from URL if present
          const urlParams = new URLSearchParams(url.split('?')[1] || '')
          const urlPaymentId = urlParams.get('m_payment_id') || paymentData?.mPaymentId || paymentIdRef.current
          
          // Show success alert
          Alert.alert(
            'Payment Successful! 🎉',
            `Your payment of R${amount.toFixed(2)} for ${itemName} has been processed successfully.`,
            [{ text: 'OK', onPress: () => {
              onSuccess({
                amount,
                itemName,
                paymentId: urlPaymentId || `pf_${Date.now()}`,
              })
              onClose()
            }}]
          )
          return
        }
        
        // Check for cancel (deep link or HTTP return URL)
        const isCancel = url.includes('payment/cancel') || 
            url.includes('status=cancel') || 
            url.includes('saplayer://payment/cancel') ||
            url.includes('/payment/return') && url.includes('status=cancel') ||
            url.includes('payment/return?status=cancel')
        
        if (isCancel) {
          console.log('❌ Payment cancelled (detected from URL)')
          onCancel()
          onClose()
          return
        }
        
        // If we get here, browser was closed without proper redirect
        console.log('⚠️ Browser closed without redirect - checking payment status...')
        // Try to extract payment ID from URL if it's the return URL
        const urlParams = new URLSearchParams(url.split('?')[1] || '')
        const urlPaymentId = urlParams.get('m_payment_id')
        await checkPaymentStatus(urlPaymentId || undefined)
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('⚠️ Browser dismissed - checking payment status...')
        // User might have closed browser after successful payment
        // Check with backend if payment was successful
        await checkPaymentStatus()
      } else {
        // Unknown result type - check payment status
        console.log('⚠️ Unknown browser result type:', result.type, '- checking payment status...')
        await checkPaymentStatus()
      }
    } catch (error) {
      console.error('Browser open error:', error)
      if (onError) {
        onError('Failed to open payment page. Please try again.')
      }
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
            <Text style={styles.loadingText}>Initializing payment...</Text>
          </View>
        )}

        {/* Payment Info */}
        {!loading && (
          <View style={styles.contentContainer}>
            <View style={styles.infoCard}>
              <Ionicons name="card-outline" size={48} color={theme.tintColor || '#73EC8B'} />
              <Text style={styles.infoTitle}>Payment Ready</Text>
              <Text style={styles.infoText}>
                Your payment page will open in your browser. Complete the payment there and return to the app.
              </Text>
              <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item:</Text>
                  <Text style={styles.detailValue}>{itemName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>R{amount.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={createPayment}
              >
                <Ionicons name="refresh-outline" size={20} color={theme.textColor} />
                <Text style={styles.actionButtonText}>Retry Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40, // Balance close button
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    zIndex: 1,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.containerPadding,
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: theme.cardBackground || '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  infoText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  paymentDetails: {
    width: '100%',
    marginTop: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailValue: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  retryButton: {
    backgroundColor: theme.cardBackground || '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
})
