import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Pressable,
  Text as RNText,
} from 'react-native'
import { useContext, useState, useEffect } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { AppButton } from '../ui/AppButton'
import { SPACING, TYPOGRAPHY, RADIUS, LISTING_TILE_BORDER, PROFILE_CHART_ACCENT } from '../../constants/layout'
import { androidLabelStyle } from '../../utils/platformHelpers'
import { VerificationTermsSheet } from './VerificationTermsSheet'

export interface BulkVaultingCollection {
  id: number
  name: string
  image?: string
  set?: string
  cardNumber?: string
  type: string
}

interface BulkVaultingModalProps {
  visible: boolean
  collections: BulkVaultingCollection[]
  onClose: () => void
  onRequestVaulting: (collectionIds: number[]) => Promise<void>
}

function formatCardNumber(num?: string): string | null {
  if (!num?.trim()) return null
  const t = num.trim()
  return t.startsWith('#') ? t : `#${t}`
}

function formatTypeLabel(type: string): string {
  if (type === 'slab') return 'Slab'
  if (type === 'sealed') return 'Sealed'
  return 'Card'
}

function buildMetaLine(set?: string, cardNumber?: string, type?: string): string | null {
  const parts: string[] = []
  if (set?.trim()) parts.push(set.trim())
  const num = formatCardNumber(cardNumber)
  if (num) parts.push(num)
  if (parts.length === 0 && type) parts.push(formatTypeLabel(type))
  return parts.length > 0 ? parts.join(' · ') : null
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
  const [termsVisible, setTermsVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set())
      setTermsVisible(false)
    }
  }, [visible])

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === collections.length && collections.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(collections.map((c) => c.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('No selection', 'Select at least one card to request verification.')
      return
    }
    setIsSubmitting(true)
    try {
      await onRequestVaulting(Array.from(selectedIds))
      setSelectedIds(new Set())
      onClose()
    } catch (error) {
      console.error('Error requesting verification:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setSelectedIds(new Set())
    onClose()
  }

  const allSelected = selectedIds.size === collections.length && collections.length > 0

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTouchable} onPress={handleClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>Request verification</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={22} color={theme.textColor} />
              </TouchableOpacity>
            </View>
            <RNText style={styles.subtitle}>
              Get a PUDO code to drop your cards at a locker. We verify them and send them back to you through
              PUDO. You have 24 hours to submit after you receive your code. See our{' '}
              <RNText style={styles.termsLink} onPress={() => setTermsVisible(true)}>
                Terms and conditions
              </RNText>
              .
            </RNText>
          </View>

          <View style={styles.toolbar}>
            <Pressable style={styles.selectAllRow} onPress={selectAll}>
              <View style={[styles.checkbox, allSelected && styles.checkboxChecked]}>
                {allSelected ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
              </View>
              <RNText style={styles.selectAllText}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </RNText>
            </Pressable>
            <RNText style={styles.selectedCount}>
              {selectedIds.size} selected
            </RNText>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            bounces={false}
          >
            {collections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={40} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyText}>No cards in your collection</Text>
                <Text style={styles.emptySubtext}>Add cards first, then request verification.</Text>
              </View>
            ) : (
              collections.map((collection) => {
                const isSelected = selectedIds.has(collection.id)
                const meta = buildMetaLine(collection.set, collection.cardNumber, collection.type)
                const imageUri =
                  typeof collection.image === 'string'
                    ? collection.image
                    : collection.image?.uri

                return (
                  <Pressable
                    key={collection.id}
                    style={[styles.cardRow, isSelected && styles.cardRowSelected]}
                    onPress={() => toggleSelection(collection.id)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                    </View>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.cardThumb} resizeMode="contain" />
                    ) : (
                      <View style={styles.cardThumbPlaceholder}>
                        <Ionicons name="image-outline" size={18} color="rgba(255,255,255,0.35)" />
                      </View>
                    )}
                    <View style={styles.cardTextCol}>
                      <RNText style={styles.cardName} numberOfLines={2}>
                        {collection.name}
                      </RNText>
                      {meta ? (
                        <RNText style={styles.cardMeta} numberOfLines={1}>
                          {meta}
                        </RNText>
                      ) : null}
                    </View>
                  </Pressable>
                )
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              variant="outline"
              size="sm"
              label="Cancel"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.footerBtn}
            />
            <AppButton
              variant="accent"
              size="sm"
              label={
                isSubmitting
                  ? 'Requesting…'
                  : `Request (${selectedIds.size})`
              }
              onPress={handleSubmit}
              disabled={selectedIds.size === 0 || isSubmitting}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>

      <VerificationTermsSheet visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </Modal>
  )
}

const getStyles = (theme: {
  textColor?: string
  cardBackground?: string
  backgroundColor?: string
  semiBoldFont?: string
  regularFont?: string
  boldFont?: string
  tintColor?: string
}) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.containerPadding,
    },
    overlayTouchable: {
      ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 440,
      maxHeight: '88%',
      backgroundColor: theme.cardBackground || '#1a1a1a',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: LISTING_TILE_BORDER,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: SPACING.cardPadding,
      paddingTop: SPACING.cardPadding,
      paddingBottom: SPACING.sm,
      gap: SPACING.stackGap,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    title: {
      flex: 1,
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
      lineHeight: Math.round(TYPOGRAPHY.h4 * 1.2),
      ...androidLabelStyle,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.55)',
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.4),
    },
    termsLink: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.semiBoldFont,
      color: PROFILE_CHART_ACCENT,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.cardPadding,
      paddingBottom: SPACING.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    selectAllText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      ...androidLabelStyle,
    },
    selectedCount: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.5)',
      ...androidLabelStyle,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.tintColor || '#73EC8B',
      borderColor: theme.tintColor || '#73EC8B',
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    scrollContent: {
      padding: SPACING.cardPadding,
      gap: SPACING.stackGap,
    },
    emptyContainer: {
      paddingVertical: SPACING.xl,
      alignItems: 'center',
      gap: SPACING.xs,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.bodySmall,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: TYPOGRAPHY.caption,
      color: 'rgba(255, 255, 255, 0.4)',
      textAlign: 'center',
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    cardRowSelected: {
      borderColor: theme.tintColor || '#73EC8B',
      backgroundColor: 'rgba(115, 236, 139, 0.08)',
    },
    cardThumb: {
      width: 40,
      height: 56,
      borderRadius: RADIUS.sm,
    },
    cardThumbPlaceholder: {
      width: 40,
      height: 56,
      borderRadius: RADIUS.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTextCol: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    cardName: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      lineHeight: Math.round(TYPOGRAPHY.bodySmall * 1.25),
      ...androidLabelStyle,
    },
    cardMeta: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.55)',
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.2),
      ...androidLabelStyle,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.cardPadding,
      paddingVertical: SPACING.cardPadding,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    footerBtn: {
      flex: 1,
    },
  })
