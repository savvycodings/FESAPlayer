import { useState, useContext } from 'react'
import { View, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import DateTimePicker from '@react-native-community/datetimepicker'

interface CreateAuctionModalProps {
  visible: boolean
  onClose: () => void
  onCreateAuction: (data: { title: string; description: string; startTime: Date }) => void
}

export function CreateAuctionModal({
  visible,
  onClose,
  onCreateAuction,
}: CreateAuctionModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date>(() => {
    // Default to 1 hour from now
    const date = new Date()
    date.setHours(date.getHours() + 1)
    date.setMinutes(0)
    return date
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) {
      // TODO: Show error message
      return
    }

    // Validate date is in the future
    const now = new Date()
    if (startDate <= now) {
      // TODO: Show error message
      return
    }

    onCreateAuction({
      title: title.trim(),
      description: description.trim(),
      startTime: startDate,
    })

    // Reset form
    setTitle('')
    setDescription('')
    const defaultDate = new Date()
    defaultDate.setHours(defaultDate.getHours() + 1)
    defaultDate.setMinutes(0)
    setStartDate(defaultDate)
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    const defaultDate = new Date()
    defaultDate.setHours(defaultDate.getHours() + 1)
    defaultDate.setMinutes(0)
    setStartDate(defaultDate)
    setShowDatePicker(false)
    setShowTimePicker(false)
    onClose()
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
    
    if (isToday) {
      return 'Today'
    } else if (isTomorrow) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <>
      {/* Android Date/Time Pickers - Must be outside Modal */}
      {Platform.OS === 'android' && (
        <>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              is24Hour={false}
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false)
                if (selectedDate) {
                  const newDate = new Date(selectedDate)
                  newDate.setHours(startDate.getHours())
                  newDate.setMinutes(startDate.getMinutes())
                  setStartDate(newDate)
                }
              }}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={startDate}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false)
                if (selectedDate) {
                  const newDate = new Date(startDate)
                  newDate.setHours(selectedDate.getHours())
                  newDate.setMinutes(selectedDate.getMinutes())
                  setStartDate(newDate)
                }
              }}
            />
          )}
        </>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleClose}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Auction</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            bounces={false}
          >
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Auction Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Premium Charizard Collection"
                placeholderTextColor={theme.placeholderTextColor || theme.mutedForegroundColor || '#999'}
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe what you're auctioning..."
                placeholderTextColor={theme.placeholderTextColor || theme.mutedForegroundColor || '#999'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>{description.length}/500</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Start Date & Time</Text>
              <Text style={styles.inputHint}>When should the auction start? Default is 1 hour from now.</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(true)
                      setShowTimePicker(false)
                    } else {
                      setShowDatePicker(!showDatePicker)
                      setShowTimePicker(false)
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateTimeButtonContent}>
                    <Ionicons name="calendar-outline" size={20} color={theme.tintColor || '#73EC8B'} />
                    <View style={styles.dateTimeButtonTextContainer}>
                      <Text style={styles.dateTimeLabel}>Date</Text>
                      <Text style={[styles.dateTimeValue, { color: theme.textColor }]}>
                        {formatDate(startDate)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      setShowTimePicker(true)
                      setShowDatePicker(false)
                    } else {
                      setShowTimePicker(!showTimePicker)
                      setShowDatePicker(false)
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateTimeButtonContent}>
                    <Ionicons name="time-outline" size={20} color={theme.tintColor || '#73EC8B'} />
                    <View style={styles.dateTimeButtonTextContainer}>
                      <Text style={styles.dateTimeLabel}>Time</Text>
                      <Text style={[styles.dateTimeValue, { color: theme.textColor }]}>
                        {formatTime(startDate)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* iOS Date/Time Pickers - Inline in ScrollView */}
            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  is24Hour={false}
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const newDate = new Date(selectedDate)
                      newDate.setHours(startDate.getHours())
                      newDate.setMinutes(startDate.getMinutes())
                      setStartDate(newDate)
                    }
                  }}
                  minimumDate={new Date()}
                  style={styles.iosPicker}
                />
              </View>
            )}
            {Platform.OS === 'ios' && showTimePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={startDate}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const newDate = new Date(startDate)
                      newDate.setHours(selectedDate.getHours())
                      newDate.setMinutes(selectedDate.getMinutes())
                      setStartDate(newDate)
                    }
                  }}
                  style={styles.iosPicker}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.borderColor }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.tintColor || '#73EC8B' }]}
              onPress={handleCreate}
              activeOpacity={0.7}
            >
              <Ionicons name="gift-outline" size={18} color={theme.tintTextColor || '#000000'} />
              <Text style={[styles.createButtonText, { color: theme.tintTextColor || '#000000' }]}>
                Create Auction
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
    </>
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xs,
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  inputHint: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    paddingTop: SPACING.md,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  dateTimeContainer: {
    gap: SPACING.sm,
  },
  dateTimeButton: {
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  dateTimeButtonTextContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
  },
  pickerContainer: {
    marginVertical: SPACING.md,
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  iosPicker: {
    height: 200,
    backgroundColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.cardPadding,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
  },
})
