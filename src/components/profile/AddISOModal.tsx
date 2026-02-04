import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { useContext, useState, useEffect } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface AddISOModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (cardName: string, cardNumber: string, set: string) => void
}

export function AddISOModal({
  visible,
  onClose,
  onAdd,
}: AddISOModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [set, setSet] = useState('')

  useEffect(() => {
    if (visible) {
      setCardName('')
      setCardNumber('')
      setSet('')
    }
  }, [visible])

  const isValid = () => {
    return cardName.trim().length > 0 && cardNumber.trim().length > 0 && set.trim().length > 0
  }

  const handleAdd = () => {
    if (isValid()) {
      onAdd(cardName.trim(), cardNumber.trim(), set.trim())
      setCardName('')
      setCardNumber('')
      setSet('')
      onClose()
    }
  }

  const handleClose = () => {
    setCardName('')
    setCardNumber('')
    setSet('')
    onClose()
  }

  return (
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
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Card to ISO</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {/* Card Name Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Card Name</Text>
              <TextInput
                style={styles.textInput}
                value={cardName}
                onChangeText={setCardName}
                placeholder="e.g., Charizard ex"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoFocus
              />
            </View>

            {/* Card Number Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.textInput}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="e.g., 223/165"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>

            {/* Set Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Set</Text>
              <TextInput
                style={styles.textInput}
                value={set}
                onChangeText={setSet}
                placeholder="e.g., Obsidian Flames"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>

            {/* Footer Button */}
            <TouchableOpacity
              style={[styles.addButton, !isValid() && styles.addButtonDisabled]}
              onPress={handleAdd}
              activeOpacity={0.8}
              disabled={!isValid()}
            >
              <Text style={styles.addButtonText}>Add to ISO</Text>
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
      borderColor: 'rgba(255, 255, 255, 0.08)',
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
    inputSection: {
      marginBottom: SPACING.lg,
    },
    inputLabel: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: SPACING.md,
    },
    textInput: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: SPACING.md,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
    },
    addButton: {
      backgroundColor: theme.tintColor || '#73EC8B',
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.lg,
    },
    addButtonDisabled: {
      backgroundColor: 'rgba(115, 236, 139, 0.3)',
      opacity: 0.5,
    },
    addButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: '#000000',
      fontWeight: '600',
    },
  })
