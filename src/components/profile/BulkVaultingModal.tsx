import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useContext, useState, useEffect } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { Image } from 'react-native'

interface Collection {
  id: number
  name: string
  image?: string
  set?: string
  type: string
}

interface BulkVaultingModalProps {
  visible: boolean
  collections: Collection[]
  onClose: () => void
  onRequestVaulting: (collectionIds: number[]) => Promise<void>
}

export function BulkVaultingModal({
  visible,
  collections,
  onClose,
  onRequestVaulting,
}: BulkVaultingModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set())
    }
  }, [visible])

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === collections.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(collections.map(c => c.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('No Selection', 'Please select at least one card to request vaulting.')
      return
    }

    setIsSubmitting(true)
    try {
      await onRequestVaulting(Array.from(selectedIds))
      setSelectedIds(new Set())
      onClose()
    } catch (error) {
      console.error('Error requesting vaulting:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedIds(new Set())
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
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Request Vaulting</Text>
              <Text style={styles.subtitle}>
                Select cards to send to our vault for safe storage
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* Select All Button */}
          <View style={styles.selectAllContainer}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={selectAll}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selectedIds.size === collections.length && collections.length > 0 && styles.checkboxChecked]}>
                {selectedIds.size === collections.length && collections.length > 0 && (
                  <Ionicons name="checkmark" size={16} color="#000" />
                )}
              </View>
              <Text style={styles.selectAllText}>
                {selectedIds.size === collections.length && collections.length > 0 ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectedCount}>
              {selectedIds.size} {selectedIds.size === 1 ? 'card' : 'cards'} selected
            </Text>
          </View>

          {/* Cards List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {collections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyText}>No cards in your collection</Text>
                <Text style={styles.emptySubtext}>
                  Add cards to your collection first
                </Text>
              </View>
            ) : (
              collections.map((collection) => {
                const isSelected = selectedIds.has(collection.id)
                return (
                  <TouchableOpacity
                    key={collection.id}
                    style={[styles.cardItem, isSelected && styles.cardItemSelected]}
                    onPress={() => toggleSelection(collection.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardItemLeft}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#000" />
                        )}
                      </View>
                      {collection.image ? (
                        <Image
                          source={{ uri: collection.image }}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <Ionicons name="image-outline" size={20} color="rgba(255, 255, 255, 0.3)" />
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {collection.name}
                        </Text>
                        {collection.set && (
                          <Text style={styles.cardSet} numberOfLines={1}>
                            {collection.set}
                          </Text>
                        )}
                        <Text style={styles.cardType}>
                          {collection.type.charAt(0).toUpperCase() + collection.type.slice(1)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.tintColor || '#73EC8B'} />
                    )}
                  </TouchableOpacity>
                )
              })
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, (selectedIds.size === 0 || isSubmitting) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={selectedIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.buttonTextPrimary}>
                  Request Vaulting ({selectedIds.size})
                </Text>
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
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: theme.cardBackground || '#1a1a1a',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.tintColor || '#73EC8B',
    borderColor: theme.tintColor || '#73EC8B',
  },
  selectAllText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.tintColor || '#73EC8B',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  emptyContainer: {
    padding: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardItemSelected: {
    backgroundColor: 'rgba(115, 236, 139, 0.1)',
    borderColor: theme.tintColor || '#73EC8B',
  },
  cardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  cardImage: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.sm,
  },
  cardImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  cardSet: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.xs / 2,
  },
  cardType: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonPrimary: {
    backgroundColor: theme.tintColor || '#73EC8B',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextSecondary: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: '#000',
    fontWeight: '600',
  },
})
