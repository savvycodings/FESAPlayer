import { useContext, useState } from 'react'
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, Alert } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface LeaveReviewModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (rating: number, comment: string) => Promise<void> | void
}

export function LeaveReviewModal({ visible, onClose, onSubmit }: LeaveReviewModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleStarPress = (value: number) => {
    setRating(value)
  }

  const handleClose = () => {
    if (submitting) return
    setComment('')
    setRating(5)
    onClose()
  }

  const handleSubmit = async () => {
    if (submitting) return
    if (!rating || rating < 1 || rating > 5) {
      if (Platform.OS !== 'web') Alert.alert('Review', 'Please select a rating from 1 to 5 stars.')
      return
    }
    setSubmitting(true)
    try {
      await Promise.resolve(onSubmit(rating, comment.trim()))
      setComment('')
      setRating(5)
      onClose()
    } catch (e: any) {
      const message = e?.message || 'Failed to submit review. Please try again.'
      if (Platform.OS !== 'web') Alert.alert('Review', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Leave a review</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={20} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => handleStarPress(value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={24}
                  color={theme.tintColor || '#73EC8B'}
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Review</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Share your experience with this seller…"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={comment}
            onChangeText={setComment}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.8}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.cardBackground || '#05060A',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
  },
  label: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  starIcon: {
    marginRight: SPACING.xs,
  },
  textInput: {
    minHeight: 80,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: TYPOGRAPHY.body,
    marginBottom: SPACING.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  button: {
    height: 40,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    backgroundColor: theme.tintColor || '#73EC8B',
  },
  cancelText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.boldFont,
    color: '#000000',
  },
})

